/** Diseño para una fase futura con backend. No se ejecuta ni cobra desde la web estática. */
export type RequestReference = `AL-${string}`;
export interface OrderIntent {
  requestId: RequestReference;
  productId?: string;
  variationId?: string;
  requestedBudgetMXN: number;
  preferredDeliveryDate: string;
  preferredTimeSlot: string;
  deliveryArea: { region: 'cdmx' | 'edomex'; neighborhood: string; borough: string; postalCode: string };
  dedication?: string;
  preferences?: string;
  notes?: string;
}
/** Solo la operación/backend puede emitir una cotización aceptada. */
export interface ConfirmedQuote {
  quoteId: string;
  requestId: RequestReference;
  amountMXNCents: number;
  deliveryMXNCents: number;
  expiresAt: string;
  acceptedAt: string;
}
export interface PaymentProvider {
  /** Ejecutar exclusivamente en backend con la cotización real, nunca un precio del cliente. */
  createIntent(quote: ConfirmedQuote, idempotencyKey: string): Promise<{ providerReference: string; checkoutURL: string }>;
  /** Verificar firma y consultar al proveedor; un retorno de navegador no confirma pago. */
  verifyWebhook(rawBody: Uint8Array, signature: string): Promise<{
    providerReference: string;
    quoteId: string;
    status: 'pending' | 'verified_paid' | 'failed';
    verifiedAmountMXNCents: number;
    providerEventId: string;
  }>;
}
