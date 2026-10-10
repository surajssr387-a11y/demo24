import express from 'express';
import { PaymentService } from '../src/server/paymentService';

const app = express();
const paymentService = new PaymentService();

// Raw body parser for webhook cryptographic verification
app.use(
  ['/api/payment/webhook', '/api/webhook', '/webhook'],
  express.raw({
    type: '*/*',
    limit: '5mb',
  })
);

app.use(express.json({ limit: '2mb' }));

app.get(['/api/payment/config'], (_req, res) => {
  res.json({
    keyId: paymentService.getKeyId(),
    currency: 'INR',
    merchantName: "Ramy's Dance Studio",
    themeColor: '#0066FF',
  });
});

app.post(['/api/payment/create-order'], async (req, res) => {
  try {
    const {
      studentName,
      studentPhone,
      programId,
      programName,
      planType,
      routineCount,
      batchDetails,
      preferredDate,
      preferredTime,
      idempotencyKey,
    } = req.body || {};

    const name = String(studentName || '').trim();
    const phone = String(studentPhone || '').trim().replace(/\D/g, '');

    if (!name || phone.length < 10) {
      return res.status(400).json({ error: 'Valid student name and 10-digit mobile number are required.' });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'client';

    const safePlanType =
      planType === 'special_offer'
        ? 'special_offer'
        : planType === 'demo'
        ? 'demo'
        : planType === 'home_service'
        ? 'home_service'
        : planType === 'private_class'
        ? 'private_class'
        : planType === 'custom_wedding'
        ? 'custom_wedding'
        : 'monthly';

    const orderData = await paymentService.createOrder({
      studentName: name,
      studentPhone: phone,
      programId: String(programId || 'kids-dance'),
      programName: String(programName || "Ramy's Dance Studio Class"),
      planType: safePlanType,
      routineCount: Number(routineCount) || undefined,
      batchDetails: batchDetails ? String(batchDetails) : undefined,
      preferredDate: preferredDate ? String(preferredDate) : undefined,
      preferredTime: preferredTime ? String(preferredTime) : undefined,
      idempotencyKey: idempotencyKey ? String(idempotencyKey) : undefined,
      clientIp,
    });

    return res.json({
      success: true,
      orderId: orderData.orderId,
      amount: orderData.amount,
      currency: orderData.currency,
      keyId: orderData.keyId,
      traceId: orderData.traceId,
    });
  } catch (err: any) {
    console.error('Error creating payment order:', err);
    return res.status(500).json({ error: 'Failed to initiate secure payment order.' });
  }
});

const handleVerifyFlow = (req: express.Request, res: express.Response) => {
  const { orderId, paymentId, signature } = req.body || {};
  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required.' });
  }
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'client';

  if (!paymentId) {
    const order = paymentService.getOrder(String(orderId));
    if (!order) return res.status(404).json({ error: 'Order not found' });
    return res.json({
      success: order.status === 'SUCCESS',
      status: order.status,
      orderId: order.order_id,
      traceId: order.trace_id,
      amount: order.amount_in_paise,
      currency: order.currency,
      paymentId: order.razorpay_payment_id,
      whatsappUrl: order.whatsapp_url,
    });
  }

  const result = paymentService.verifyPayment({
    orderId: String(orderId),
    paymentId: String(paymentId),
    signature: signature ? String(signature) : undefined,
    clientIp,
  });

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.message });
  }

  return res.json({
    success: true,
    status: 'SUCCESS',
    message: result.message,
    order: result.order,
    whatsappUrl: result.whatsappUrl,
  });
};

app.post(['/api/payment/verify-or-status', '/api/payment/verify'], (req, res) => {
  return handleVerifyFlow(req, res);
});

app.get(['/api/payment/verify-or-status'], (req, res) => {
  const orderId = String(req.query.orderId || req.query.id || '');
  if (!orderId) return res.status(400).json({ error: 'orderId query param required' });
  const order = paymentService.getOrder(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  return res.json({
    success: order.status === 'SUCCESS',
    status: order.status,
    orderId: order.order_id,
    traceId: order.trace_id,
    amount: order.amount_in_paise,
    currency: order.currency,
    paymentId: order.razorpay_payment_id,
    whatsappUrl: order.whatsapp_url,
  });
});

const webhookHandler = (req: express.Request, res: express.Response) => {
  try {
    const signature = (req.headers['x-razorpay-signature'] as string) || '';
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'webhook';
    const result = paymentService.handleWebhook(rawBody, signature, clientIp);
    return res.status(200).json({ status: result.success ? 'ok' : 'ignored', event: result.event });
  } catch (err) {
    return res.status(200).json({ status: 'error_handled' });
  }
};

app.post(['/api/payment/webhook', '/api/webhook', '/webhook'], webhookHandler);
app.post('/', (req, res, next) => {
  if (req.headers['x-razorpay-signature']) return webhookHandler(req, res);
  next();
});

export default app;
