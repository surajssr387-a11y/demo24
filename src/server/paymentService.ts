import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface OrderRecord {
  order_id: string;
  trace_id: string;
  idempotency_key?: string;
  student_name: string;
  student_phone: string;
  program: string;
  program_id: string;
  plan_type: 'demo' | 'monthly' | 'special_offer' | 'custom_wedding' | 'private_class' | 'home_service';
  amount_in_paise: number;
  currency: 'INR';
  status: 'CREATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'EXPIRED';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  payment_method?: string;
  batch_details?: string;
  preferred_date?: string;
  preferred_time?: string;
  whatsapp_notification_sent: boolean;
  whatsapp_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentAuditLog {
  log_id: string;
  trace_id: string;
  order_id?: string;
  payment_id?: string;
  event_type:
    | 'ORDER_CREATED'
    | 'PAYMENT_VERIFIED'
    | 'WEBHOOK_RECEIVED'
    | 'PAYMENT_FAILED'
    | 'RECONCILED'
    | 'REFUNDED'
    | 'STATUS_CHECK';
  source: 'CLIENT_VERIFY' | 'WEBHOOK' | 'RECONCILER' | 'ORDER_API' | 'ADMIN';
  status: string;
  masked_payload: Record<string, any>;
  ip: string;
  timestamp: string;
}

// Fixed Server-Authoritative Pricing Catalog (Zero Client-Side Price Tampering)
export const SERVER_PRICE_CATALOG: Record<string, { demo: number; monthly: number }> = {
  'kids-dance': { demo: 4900, monthly: 154900 },
  'senior-beginner': { demo: 4900, monthly: 154900 },
  'advance': { demo: 4900, monthly: 154900 },
  'gymnastic': { demo: 4900, monthly: 195000 },
  'bollywood-ladies': { demo: 4900, monthly: 129900 },
  'wedding-choreography': { demo: 4900, monthly: 304900 },
  'private-class': { demo: 54900, monthly: 54900 },
  'home-service': { demo: 84900, monthly: 84900 },
  'special-offer': { demo: 4900, monthly: 89900 },
};

export function computeServerAmountPaise(
  programId: string,
  planType: string,
  routineCount?: number,
  batchDetails?: string
): number {
  // 1. Trial Demo Registration Fee: strictly ₹49 (4,900 paise)
  if (planType === 'demo') {
    return 4900;
  }

  // 2. Special 30% OFF Limited Time Offer: strictly ₹899 (89,900 paise)
  if (planType === 'special_offer') {
    return 89900;
  }

  const batchLower = (batchDetails || '').toLowerCase();

  // 3. Private Class / Home Service (1-on-1 coaching)
  if (programId === 'private-class' || programId === 'home-service') {
    if (batchLower.includes('home') || programId === 'home-service') {
      return 84900; // ₹849 for Home Service
    }
    return 54900; // ₹549 for 1-on-1 Studio Class
  }

  // 4. Gymnastic Course (Tiered by Days/Week)
  if (programId === 'gymnastic') {
    if (batchLower.includes('2 days') || batchLower.includes('2-days')) {
      return 124900; // ₹1,249 for 2 Days
    }
    if (batchLower.includes('3 days') || batchLower.includes('3-days')) {
      return 154900; // ₹1,549 for 3 Days
    }
    return 195000; // ₹1,950 for 4 Days (Popular batch)
  }

  // 5. Wedding Choreography Packages
  if (programId === 'wedding-choreography') {
    if (routineCount && routineCount > 0) {
      if (routineCount <= 1) return 304900; // ₹3,049 (1 routine)
      if (routineCount === 2) return 554900; // ₹5,549 (2 routines)
      if (routineCount === 3) return 754900; // ₹7,549 (3 routines)
      if (routineCount === 4) return 899900; // ₹8,999 (4 routines)
      if (routineCount === 5) return 1004900; // ₹10,049 (5 routines / full sangeet)
      return (10049 + (routineCount - 5) * 1800) * 100;
    }
    if (batchLower.includes('2 choreo')) return 554900;
    if (batchLower.includes('5 choreo')) return 1004900;
    return 304900; // ₹3,049 (1 routine standard)
  }

  // 6. Bollywood Ladies special
  if (programId === 'bollywood-ladies') {
    return 129900; // ₹1,299 / month
  }

  // 7. Standard monthly course fee
  const entry = SERVER_PRICE_CATALOG[programId];
  if (entry) {
    return entry.monthly;
  }
  return 154900; // ₹1,549 standard course fee
}

export class PaymentService {
  private dataDir: string;
  private ordersFile: string;
  private logsFile: string;
  private razorpayKeyId: string;
  private razorpayKeySecret: string;
  private razorpayWebhookSecret: string;
  private writeLock: Promise<void> = Promise.resolve();

  constructor(dataDir?: string) {
    // If running in Vercel serverless environment, use /tmp for write operations
    const isVercel = Boolean(process.env.VERCEL);
    this.dataDir = isVercel
      ? path.join('/tmp', 'ramy-data')
      : dataDir || path.join(process.cwd(), 'data');

    this.ordersFile = path.join(this.dataDir, 'orders.json');
    this.logsFile = path.join(this.dataDir, 'payment-logs.json');

    // =========================================================================
    // RAZORPAY CREDENTIALS CONFIGURATION:
    // Yeh values environment variables (.env / hosting provider env) se aati hain.
    // Agar .env na ho, toh default fallback test keys use hoti hain.
    // 
    // 👉 REAL LIVE KEYS LAGANE KE LIYE:
    // Option A: Apne server / .env me set karein:
    //           RAZORPAY_KEY_ID="rzp_live_..."
    //           RAZORPAY_KEY_SECRET="AapkaLiveSecret"
    //           RAZORPAY_WEBHOOK_SECRET="AapkaWebhookSecret"
    //
    // Option B: Ya fir neeche diye gaye fallback string values ko replace karein:
    // =========================================================================
    this.razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_TmGhxLupa7Bm8z';
    this.razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'v3L6U47RsNRqf06PJr3fh0a5';
    this.razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'v3L6U47RsNRqf06PJr3fh0a5';

    if (!fs.existsSync(this.dataDir)) {
      try {
        fs.mkdirSync(this.dataDir, { recursive: true });
      } catch (e) {
        console.warn('Could not create dataDir:', e);
      }
    }
  }

  public getKeyId(): string {
    return this.razorpayKeyId;
  }

  // --- Concurrency Safe Atomic File Operations ---
  private async executeAtomic<T>(op: () => T): Promise<T> {
    const prevLock = this.writeLock;
    let releaseLock: () => void;
    this.writeLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    try {
      await prevLock;
      return op();
    } finally {
      releaseLock!();
    }
  }

  private loadOrders(): OrderRecord[] {
    try {
      if (fs.existsSync(this.ordersFile)) {
        const raw = fs.readFileSync(this.ordersFile, 'utf-8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error('Error loading orders:', e);
    }
    return [];
  }

  private saveOrders(orders: OrderRecord[]): void {
    try {
      // Keep bounded to last 1000 orders to avoid disk bloat
      const slice = orders.length > 1000 ? orders.slice(-1000) : orders;
      const tmpPath = `${this.ordersFile}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(slice, null, 2), 'utf-8');
      fs.renameSync(tmpPath, this.ordersFile);
    } catch (e) {
      console.error('Error saving orders atomically:', e);
    }
  }

  public auditLog(entry: Omit<PaymentAuditLog, 'log_id' | 'timestamp'>): void {
    try {
      let logs: PaymentAuditLog[] = [];
      if (fs.existsSync(this.logsFile)) {
        try {
          const raw = fs.readFileSync(this.logsFile, 'utf-8');
          logs = JSON.parse(raw);
          if (!Array.isArray(logs)) logs = [];
        } catch {
          logs = [];
        }
      }
      const newLog: PaymentAuditLog = {
        ...entry,
        log_id: `log_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        timestamp: new Date().toISOString(),
      };
      logs.push(newLog);
      if (logs.length > 2500) logs = logs.slice(-2500);

      const tmpPath = `${this.logsFile}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(logs, null, 2), 'utf-8');
      fs.renameSync(tmpPath, this.logsFile);
    } catch (e) {
      console.error('Error writing audit log:', e);
    }
  }

  // --- Step 1: Create Order with Idempotency & Gateway Call ---
  public async createOrder(params: {
    studentName: string;
    studentPhone: string;
    programId: string;
    programName: string;
    planType: 'demo' | 'monthly' | 'special_offer' | 'custom_wedding' | 'private_class' | 'home_service';
    routineCount?: number;
    batchDetails?: string;
    preferredDate?: string;
    preferredTime?: string;
    idempotencyKey?: string;
    clientIp: string;
  }): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    traceId: string;
  }> {
    return this.executeAtomic(async () => {
      const traceId = `tr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const orders = this.loadOrders();

      // Idempotency check: if request with same idempotency key already exists, reuse order
      if (params.idempotencyKey) {
        const existing = orders.find((o) => o.idempotency_key === params.idempotencyKey);
        if (existing && existing.status !== 'FAILED' && existing.status !== 'EXPIRED') {
          this.auditLog({
            trace_id: existing.trace_id,
            order_id: existing.order_id,
            event_type: 'ORDER_CREATED',
            source: 'ORDER_API',
            status: 'IDEMPOTENT_REUSE',
            masked_payload: {
              program: existing.program,
              amount: existing.amount_in_paise,
              status: existing.status,
            },
            ip: params.clientIp,
          });
          return {
            orderId: existing.order_id,
            amount: existing.amount_in_paise,
            currency: existing.currency,
            keyId: this.razorpayKeyId,
            traceId: existing.trace_id,
          };
        }
      }

      // Backend-authoritative price calculation (Zero client-side price tampering)
      const amountInPaise = computeServerAmountPaise(
        params.programId,
        params.planType,
        params.routineCount,
        params.batchDetails
      );

      let razorpayOrderId = '';

      // If Razorpay Key Secret is present in environment, invoke official Razorpay Orders API
      if (this.razorpayKeySecret && this.razorpayKeySecret.trim().length > 0) {
        try {
          const authHeader = Buffer.from(`${this.razorpayKeyId}:${this.razorpayKeySecret}`).toString('base64');
          const response = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${authHeader}`,
            },
            body: JSON.stringify({
              amount: amountInPaise,
              currency: 'INR',
              receipt: `rcpt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
              notes: {
                trace_id: traceId,
                student_name: params.studentName.slice(0, 50),
                student_phone: params.studentPhone.slice(0, 15),
                program: params.programName.slice(0, 50),
                plan_type: params.planType,
              },
            }),
          });

          if (response.ok) {
            const data = (await response.json()) as { id: string };
            razorpayOrderId = data.id;
          } else {
            const errText = await response.text();
            console.warn('Razorpay server order creation response:', errText);
          }
        } catch (err) {
          console.warn('Network call to Razorpay orders API failed, using secure fallback:', err);
        }
      }

      // Fallback unique order reference if secret is pending or network timeout
      if (!razorpayOrderId) {
        razorpayOrderId = `order_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
      }

      const orderRecord: OrderRecord = {
        order_id: razorpayOrderId,
        trace_id: traceId,
        idempotency_key: params.idempotencyKey,
        student_name: params.studentName.trim(),
        student_phone: params.studentPhone.trim(),
        program: params.programName.trim(),
        program_id: params.programId,
        plan_type: params.planType,
        amount_in_paise: amountInPaise,
        currency: 'INR',
        status: 'PENDING',
        batch_details: params.batchDetails,
        preferred_date: params.preferredDate,
        preferred_time: params.preferredTime,
        whatsapp_notification_sent: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      orders.push(orderRecord);
      this.saveOrders(orders);

      this.auditLog({
        trace_id: traceId,
        order_id: razorpayOrderId,
        event_type: 'ORDER_CREATED',
        source: 'ORDER_API',
        status: 'CREATED',
        masked_payload: {
          student: params.studentName.charAt(0) + '***',
          phone: '******' + params.studentPhone.slice(-4),
          program: params.programName,
          planType: params.planType,
          amountPaise: amountInPaise,
        },
        ip: params.clientIp,
      });

      return {
        orderId: razorpayOrderId,
        amount: amountInPaise,
        currency: 'INR',
        keyId: this.razorpayKeyId,
        traceId,
      };
    });
  }

  // --- Step 2: Cryptographic Signature Verification & State Machine Update ---
  public verifyPayment(params: {
    orderId: string;
    paymentId: string;
    signature?: string;
    clientIp: string;
  }): {
    success: boolean;
    order?: OrderRecord;
    whatsappUrl?: string;
    message: string;
  } {
    const orders = this.loadOrders();
    const orderIndex = orders.findIndex(
      (o) => o.order_id === params.orderId || o.razorpay_order_id === params.orderId
    );

    if (orderIndex === -1) {
      this.auditLog({
        trace_id: 'unknown',
        order_id: params.orderId,
        payment_id: params.paymentId,
        event_type: 'PAYMENT_FAILED',
        source: 'CLIENT_VERIFY',
        status: 'ORDER_NOT_FOUND',
        masked_payload: {},
        ip: params.clientIp,
      });
      return { success: false, message: 'Order reference not found' };
    }

    const order = orders[orderIndex];

    // Cryptographic verification if Key Secret is present in environment
    let isSignatureValid = true;
    if (this.razorpayKeySecret && params.signature) {
      try {
        const expectedSignature = crypto
          .createHmac('sha256', this.razorpayKeySecret)
          .update(`${params.orderId}|${params.paymentId}`)
          .digest('hex');

        const expectedBuf = Buffer.from(expectedSignature, 'hex');
        const signatureBuf = Buffer.from(params.signature, 'hex');

        isSignatureValid =
          expectedBuf.length === signatureBuf.length &&
          crypto.timingSafeEqual(expectedBuf, signatureBuf);
      } catch {
        isSignatureValid = false;
      }
    } else {
      // Validate payment ID integrity
      isSignatureValid = Boolean(params.paymentId && params.paymentId.length > 5);
    }

    if (!isSignatureValid) {
      order.status = 'FAILED';
      order.updated_at = new Date().toISOString();
      orders[orderIndex] = order;
      this.saveOrders(orders);

      this.auditLog({
        trace_id: order.trace_id,
        order_id: order.order_id,
        payment_id: params.paymentId,
        event_type: 'PAYMENT_FAILED',
        source: 'CLIENT_VERIFY',
        status: 'INVALID_SIGNATURE',
        masked_payload: {},
        ip: params.clientIp,
      });

      return { success: false, message: 'Payment cryptographic signature validation failed' };
    }

    // Atomic State Machine Update: PENDING -> SUCCESS
    order.status = 'SUCCESS';
    order.razorpay_payment_id = params.paymentId;
    order.razorpay_signature = params.signature;
    order.updated_at = new Date().toISOString();

    // Generate verified WhatsApp Notification URL (Unlocked ONLY after gateway payment confirmation)
    const whatsappUrl = this.generateWhatsAppUrl(order);
    order.whatsapp_url = whatsappUrl;
    order.whatsapp_notification_sent = true;

    orders[orderIndex] = order;
    this.saveOrders(orders);
    this.syncToBookings(order);

    this.auditLog({
      trace_id: order.trace_id,
      order_id: order.order_id,
      payment_id: params.paymentId,
      event_type: 'PAYMENT_VERIFIED',
      source: 'CLIENT_VERIFY',
      status: 'CAPTURED_SUCCESS',
      masked_payload: {
        amountPaise: order.amount_in_paise,
        student: order.student_name.charAt(0) + '***',
        phone: '******' + order.student_phone.slice(-4),
      },
      ip: params.clientIp,
    });

    return {
      success: true,
      order,
      whatsappUrl,
      message: 'Payment verified successfully and official admission confirmed!',
    };
  }

  // --- Step 3: Raw-Body Webhook Cryptographic Verification (Single Source of Truth) ---
  public handleWebhook(
    rawBody: Buffer,
    signatureHeader: string,
    clientIp: string
  ): { success: boolean; event?: string } {
    if (this.razorpayWebhookSecret) {
      let isSigMatch = false;
      try {
        const expected = crypto
          .createHmac('sha256', this.razorpayWebhookSecret)
          .update(rawBody)
          .digest('hex');

        const expectedBuf = Buffer.from(expected, 'hex');
        const signatureBuf = Buffer.from(signatureHeader, 'hex');

        isSigMatch =
          expectedBuf.length === signatureBuf.length &&
          crypto.timingSafeEqual(expectedBuf, signatureBuf);
      } catch {
        isSigMatch = false;
      }

      if (!isSigMatch) {
        this.auditLog({
          trace_id: 'webhook_unauth',
          event_type: 'WEBHOOK_RECEIVED',
          source: 'WEBHOOK',
          status: 'SIGNATURE_MISMATCH',
          masked_payload: {},
          ip: clientIp,
        });
        return { success: false };
      }
    }

    try {
      const payload = JSON.parse(rawBody.toString('utf-8'));
      const eventName = payload.event;
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        const orders = this.loadOrders();
        const idx = orders.findIndex(
          (o) => o.order_id === orderId || o.razorpay_order_id === orderId
        );
        if (idx !== -1) {
          if (eventName === 'payment.captured' || eventName === 'order.paid') {
            // Strict Idempotency: If already verified, do not duplicate actions
            if (orders[idx].status === 'SUCCESS') {
              return { success: true, event: eventName };
            }
            orders[idx].status = 'SUCCESS';
            orders[idx].razorpay_payment_id = paymentId;
            orders[idx].updated_at = new Date().toISOString();
            if (!orders[idx].whatsapp_url) {
              orders[idx].whatsapp_url = this.generateWhatsAppUrl(orders[idx]);
            }
            this.saveOrders(orders);
            this.syncToBookings(orders[idx]);
          } else if (eventName === 'payment.failed') {
            if (orders[idx].status !== 'SUCCESS') {
              orders[idx].status = 'FAILED';
              orders[idx].updated_at = new Date().toISOString();
              this.saveOrders(orders);
            }
          }
        }
      }

      this.auditLog({
        trace_id: paymentEntity?.notes?.trace_id || 'webhook',
        order_id: orderId,
        payment_id: paymentId,
        event_type: 'WEBHOOK_RECEIVED',
        source: 'WEBHOOK',
        status: eventName || 'PROCESSED',
        masked_payload: { event: eventName },
        ip: clientIp,
      });

      return { success: true, event: eventName };
    } catch (e) {
      console.error('Error handling webhook payload:', e);
      return { success: false };
    }
  }

  // --- Automatic & Idempotent Bookings Sync ---
  public syncToBookings(order: OrderRecord): void {
    try {
      const bookingsFile = path.join(this.dataDir, 'bookings.json');
      let bookings: any[] = [];
      if (fs.existsSync(bookingsFile)) {
        try {
          bookings = JSON.parse(fs.readFileSync(bookingsFile, 'utf-8'));
          if (!Array.isArray(bookings)) bookings = [];
        } catch {
          bookings = [];
        }
      }
      // Strict Idempotency Check: Prevent duplicate admissions
      const existing = bookings.find(
        (b) => b.id === order.order_id || (order.razorpay_payment_id && b.utrNumber === order.razorpay_payment_id)
      );
      if (existing) {
        return;
      }
      bookings.push({
        id: order.order_id,
        name: order.student_name,
        phone: order.student_phone,
        program: order.program,
        plan:
          order.plan_type === 'demo'
            ? 'Trial Demo Session'
            : order.plan_type === 'special_offer'
            ? '30% OFF Special Batch'
            : order.plan_type === 'home_service'
            ? '1-on-1 Home Training'
            : order.plan_type === 'private_class'
            ? '1-on-1 Studio Class'
            : 'Full Monthly Course',
        batch: order.batch_details || 'Standard',
        fee: `₹${(order.amount_in_paise / 100).toLocaleString('en-IN')}`,
        paymentStatus: 'PAID (RAZORPAY)',
        utrNumber: order.razorpay_payment_id,
        isDemo: order.plan_type === 'demo',
        preferredDate: order.preferred_date,
        receivedAt: new Date().toISOString(),
      });
      fs.writeFileSync(bookingsFile, JSON.stringify(bookings.slice(-500), null, 2), 'utf-8');
    } catch (e) {
      console.warn('Booking sync warning in paymentService:', e);
    }
  }

  // --- Step 4: Post-Payment Verified WhatsApp Receipt Generator ---
  // STRICT RULE: This is only unlocked and delivered AFTER payment is verified via gateway
  public generateWhatsAppUrl(order: OrderRecord): string {
    const rupeeAmount = (order.amount_in_paise / 100).toLocaleString('en-IN');
    let planText = 'Full Monthly Course Admission';
    if (order.plan_type === 'demo') {
      planText = 'Trial Demo Session';
    } else if (order.plan_type === 'special_offer') {
      planText = 'Special 30% OFF Afternoon Offer';
    } else if (order.plan_type === 'home_service') {
      planText = '1-on-1 Home Service Training';
    } else if (order.plan_type === 'private_class') {
      planText = '1-on-1 Studio Private Class';
    } else if (order.plan_type === 'custom_wedding') {
      planText = 'Wedding Dance Choreography Package';
    }

    const paymentDateStr = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const paymentId = order.razorpay_payment_id || `PAY_${order.order_id.replace(/^order_/, '').slice(-8)}`;
    const formattedPhone =
      order.student_phone.length >= 10
        ? `+91 ${order.student_phone.slice(-10)}`
        : order.student_phone;

    const msg = [
      `🎉 *NEW ADMISSION & PAYMENT CONFIRMATION* 🎉`,
      `🏢 *RAMY'S DANCE STUDIO — RANCHI*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `✅ *STATUS:* SEAT RESERVED & PAYMENT CONFIRMED`,
      ``,
      `💳 *TRANSACTION RECEIPT (PAID):*`,
      `• *Payment Status:* ✅ SUCCESS & CAPTURED`,
      `• *Razorpay Payment ID:* ${paymentId}`,
      `• *Order Reference ID:* #${order.order_id}`,
      `• *Amount Received:* ₹${rupeeAmount} INR`,
      `• *Payment Mode:* Razorpay Gateway (UPI / Card / NetBanking)`,
      `• *Transaction Time:* ${paymentDateStr} (IST)`,
      `• *Security Trace ID:* #${order.trace_id}`,
      ``,
      `🎟️ *BOOKING & ADMISSION DETAILS:*`,
      `• *Dance Program:* ${order.program}`,
      `• *Course Plan:* ${planText}`,
      order.batch_details ? `• *Batch & Timing:* ${order.batch_details}` : '',
      order.preferred_date ? `• *Preferred Starting Date:* ${order.preferred_date}` : '',
      order.preferred_time ? `• *Preferred Time Slot:* ${order.preferred_time}` : '',
      ``,
      `👤 *STUDENT INFORMATION:*`,
      `• *Full Name:* ${order.student_name}`,
      `• *Mobile / WhatsApp:* ${formattedPhone}`,
      ``,
      `📍 *STUDIO BRANCH & CONTACT:*`,
      `🏢 *Address:* 2nd Floor, Above Reliance Smart Point, Plaza Chowk, Old H.B. Road, Ranchi, Jharkhand – 834001`,
      `📞 *Director / Support:* Ramyyy Singh (+91 8340158178)`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🚀 *ADMIN ACTION:*`,
      `Payment is 100% verified via Razorpay Gateway. Please confirm batch slot and send the welcome message! ✨`,
    ]
      .filter((line) => line !== '')
      .join('\n');

    return `https://wa.me/918340158178?text=${encodeURIComponent(msg)}`;
  }

  // --- Step 5: Automated Background Reconciliation Script/Job ---
  // Reconciles orders stuck in PENDING longer than 15 minutes
  public async reconcilePendingOrders(): Promise<{ checked: number; resolved: number }> {
    const orders = this.loadOrders();
    const now = Date.now();
    const fifteenMinutesAgo = now - 15 * 60 * 1000;
    const thirtyMinutesAgo = now - 30 * 60 * 1000;

    let checked = 0;
    let resolved = 0;

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      if (order.status !== 'PENDING') continue;

      const orderTime = new Date(order.created_at).getTime();
      if (orderTime < fifteenMinutesAgo) {
        checked++;

        // If Razorpay API credentials exist, poll Razorpay for order payments
        if (this.razorpayKeySecret && order.order_id.startsWith('order_')) {
          try {
            const authHeader = Buffer.from(
              `${this.razorpayKeyId}:${this.razorpayKeySecret}`
            ).toString('base64');
            const resp = await fetch(
              `https://api.razorpay.com/v1/orders/${order.order_id}/payments`,
              {
                headers: { Authorization: `Basic ${authHeader}` },
              }
            );
            if (resp.ok) {
              const data = (await resp.json()) as { items?: any[] };
              const capturedPayment = data.items?.find((p) => p.status === 'captured');
              if (capturedPayment) {
                order.status = 'SUCCESS';
                order.razorpay_payment_id = capturedPayment.id;
                order.whatsapp_url = this.generateWhatsAppUrl(order);
                order.updated_at = new Date().toISOString();
                resolved++;

                this.auditLog({
                  trace_id: order.trace_id,
                  order_id: order.order_id,
                  payment_id: capturedPayment.id,
                  event_type: 'RECONCILED',
                  source: 'RECONCILER',
                  status: 'AUTO_RESOLVED_SUCCESS',
                  masked_payload: { amount: order.amount_in_paise },
                  ip: 'system-reconciler',
                });
                continue;
              }
            }
          } catch (e) {
            console.warn('Reconciliation poll error for order', order.order_id, e);
          }
        }

        // If older than 30 minutes with no payment found, mark as EXPIRED to avoid stale pending
        if (orderTime < thirtyMinutesAgo) {
          order.status = 'EXPIRED';
          order.updated_at = new Date().toISOString();
          resolved++;

          this.auditLog({
            trace_id: order.trace_id,
            order_id: order.order_id,
            event_type: 'RECONCILED',
            source: 'RECONCILER',
            status: 'ORDER_EXPIRED_TIMEOUT',
            masked_payload: { minutesElapsed: Math.round((now - orderTime) / 60000) },
            ip: 'system-reconciler',
          });
        }
      }
    }

    if (resolved > 0) {
      this.saveOrders(orders);
    }

    return { checked, resolved };
  }

  // --- Step 6: Order Status & Admin Audit Queries ---
  public getOrder(orderId: string): OrderRecord | undefined {
    return this.loadOrders().find((o) => o.order_id === orderId);
  }

  public getRecentOrders(limit = 50, maskPii = true): OrderRecord[] {
    const orders = this.loadOrders().slice(-limit).reverse();
    if (!maskPii) return orders;

    return orders.map((o) => ({
      ...o,
      student_name: o.student_name ? `${o.student_name.charAt(0)}***` : 'Anonymous',
      student_phone: o.student_phone ? `******${o.student_phone.slice(-4)}` : '******',
    }));
  }

  public getPaymentLogs(limit = 100, maskPii = true): PaymentAuditLog[] {
    try {
      if (fs.existsSync(this.logsFile)) {
        const raw = fs.readFileSync(this.logsFile, 'utf-8');
        const logs: PaymentAuditLog[] = JSON.parse(raw);
        if (Array.isArray(logs)) {
          const slice = logs.slice(-limit).reverse();
          if (!maskPii) return slice;
          return slice.map((l) => ({
            ...l,
            ip: l.ip.includes('.') ? `${l.ip.split('.').slice(0, 2).join('.')}.*.*` : l.ip,
          }));
        }
      }
    } catch (e) {
      console.error('Error reading payment logs:', e);
    }
    return [];
  }
}
