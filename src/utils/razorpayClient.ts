// Client-side Razorpay Gateway Integration
// Strictly follows Zero-Vulnerability and Idempotent standards

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface PaymentInitiationParams {
  studentName: string;
  studentPhone: string;
  programId: string;
  programName: string;
  planType: 'demo' | 'monthly' | 'special_offer' | 'custom_wedding' | 'private_class' | 'home_service';
  routineCount?: number;
  batchDetails?: string;
  preferredDate?: string;
  preferredTime?: string;
  onSuccess: (result: {
    orderId: string;
    paymentId: string;
    whatsappUrl?: string;
    amount: number;
    studentName: string;
    traceId?: string;
  }) => void;
  onFailure: (errorMsg: string, traceId?: string) => void;
  onClose?: () => void;
}

export async function checkPaymentStatus(orderId: string): Promise<{
  success: boolean;
  status: string;
  orderId: string;
  traceId?: string;
  amount?: number;
  paymentId?: string;
  whatsappUrl?: string;
}> {
  try {
    const res = await fetch(`/api/payment/verify-or-status?orderId=${encodeURIComponent(orderId)}`);
    if (!res.ok) {
      throw new Error('Failed to query status');
    }
    return await res.json();
  } catch (e: any) {
    return {
      success: false,
      status: 'NETWORK_ERROR',
      orderId,
    };
  }
}

export async function openRazorpayCheckout(params: PaymentInitiationParams): Promise<void> {
  let activeTraceId = '';
  try {
    // 1. Generate unique client-side idempotency key for this attempt
    const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 2. Fetch server-signed order (Client never decides the price)
    const orderRes = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: params.studentName,
        studentPhone: params.studentPhone,
        programId: params.programId,
        programName: params.programName,
        planType: params.planType,
        routineCount: params.routineCount,
        batchDetails: params.batchDetails,
        preferredDate: params.preferredDate,
        preferredTime: params.preferredTime,
        idempotencyKey,
      }),
    });

    if (!orderRes.ok) {
      const errData = await orderRes.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to initiate secure order on payment server.');
    }

    const orderData = await orderRes.json();
    if (!orderData.success || !orderData.orderId) {
      throw new Error('Invalid order response received from gateway server.');
    }

    activeTraceId = orderData.traceId || '';

    // 3. Ensure Razorpay SDK is available
    if (!window.Razorpay) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load secure Razorpay checkout script.'));
        document.body.appendChild(script);
      });
    }

    // 4. Configure Razorpay Modal Options
    const options = {
      key: orderData.keyId,
      amount: orderData.amount, // in paise
      currency: orderData.currency || 'INR',
      name: "Ramy's Dance Studio",
      description: `${params.programName} (${
        params.planType === 'demo'
          ? 'Trial Demo Fee'
          : params.planType === 'special_offer'
          ? 'Special 30% Off'
          : 'Course Admission'
      })`,
      image: '/logo-transparent.png',
      order_id: orderData.orderId.startsWith('order_') ? orderData.orderId : undefined,
      prefill: {
        name: params.studentName,
        contact: params.studentPhone,
      },
      notes: {
        trace_id: orderData.traceId,
        program: params.programName,
        student_name: params.studentName,
      },
      theme: {
        color: '#0066FF',
      },
      handler: async function (response: {
        razorpay_payment_id: string;
        razorpay_order_id?: string;
        razorpay_signature?: string;
      }) {
        try {
          // 5. Verify cryptographic signature on backend
          const verifyRes = await fetch('/api/payment/verify-or-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: response.razorpay_order_id || orderData.orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          if (!verifyRes.ok || !verifyData.success) {
            throw new Error(verifyData.error || 'Payment verification failed on gateway.');
          }

          // 6. Payment Success: Notify caller with verified WhatsApp URL
          params.onSuccess({
            orderId: orderData.orderId,
            paymentId: response.razorpay_payment_id,
            whatsappUrl: verifyData.whatsappUrl,
            amount: orderData.amount,
            studentName: params.studentName,
            traceId: activeTraceId,
          });
        } catch (err: any) {
          console.error('Payment verification error:', err);
          params.onFailure(
            err.message || 'Payment received but verification pending. Please contact support.',
            activeTraceId
          );
        }
      },
      modal: {
        ondismiss: function () {
          params.onClose?.();
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (resp: any) {
      console.warn('Razorpay payment declined/failed:', resp.error);
      const desc = resp.error?.description || '';
      const reason = resp.error?.reason || '';

      let friendlyMessage = desc || 'Payment was declined or cancelled.';
      if (
        reason === 'international_transaction_not_allowed' ||
        desc.toLowerCase().includes('international card')
      ) {
        friendlyMessage =
          'International cards are not enabled on this merchant account. For testing, please use the Indian Test Card (4012 0000 0000 0002, Exp: 12/28, CVV: 123) or Netbanking (SBI/HDFC).';
      }

      params.onFailure(
        friendlyMessage,
        activeTraceId
      );
    });

    rzp.open();
  } catch (err: any) {
    console.error('Error opening Razorpay checkout:', err);
    params.onFailure(
      err.message || 'Could not launch payment gateway. Please check connection.',
      activeTraceId
    );
  }
}
