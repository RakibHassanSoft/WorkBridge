-- SSLCommerz: store the gateway transaction id on the payment.
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "tranId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_tranId_key" ON "Payment"("tranId");
