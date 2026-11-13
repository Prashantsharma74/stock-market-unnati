export type IntegrationStatus = 'not_configured' | 'configured'

export type ProviderDescriptor = {
  id: string
  purpose: string
  status: IntegrationStatus
  note: string
}

export const plannedIntegrations: ProviderDescriptor[] = [
  {
    id: 'mutual-fund-transactions',
    purpose: 'Place and reconcile mutual fund orders through an authorised provider',
    status: 'not_configured',
    note: 'No provider contract or credentials are connected.',
  },
  {
    id: 'kyc',
    purpose: 'PAN and KYC verification',
    status: 'not_configured',
    note: 'Profiles store a status only. PAN and bank details are not collected.',
  },
  {
    id: 'market-data',
    purpose: 'Exchange prices and fund NAVs',
    status: 'not_configured',
    note: 'Dashboard figures come from the built-in simulated dataset.',
  },
  {
    id: 'broker',
    purpose: 'Stock orders through a registered broker',
    status: 'not_configured',
    note: 'Stock trading is not implemented.',
  },
  {
    id: 'payments',
    purpose: 'Payment collection for investments',
    status: 'not_configured',
    note: 'Unnati does not accept investment money.',
  },
  {
    id: 'banking',
    purpose: 'Bank account verification and mandates',
    status: 'not_configured',
    note: 'No banking partner is connected.',
  },
  {
    id: 'lending',
    purpose: 'Credit products',
    status: 'not_configured',
    note: 'Lending is outside the current product.',
  },
]

export function integrationSnapshot(marketDataLive: boolean): ProviderDescriptor[] {
  if (!marketDataLive) return plannedIntegrations
  return plannedIntegrations.map((item) =>
    item.id === 'market-data'
      ? {
          ...item,
          status: 'configured',
          note: 'Infoway returned a live trade to this API process.',
        }
      : item,
  )
}
