export const SERVICE_TYPES = [
  { label: 'Mowing', value: 'mowing' },
  { label: 'Graveyard cleaning', value: 'graveyard_cleaning' },
  { label: 'Lot maintenance', value: 'lot_maintenance' },
  { label: 'Banner design', value: 'banner_design' },
  { label: 'Video editing', value: 'video_editing' },
  { label: 'Other', value: 'other' }
]

export const INQUIRY_SOURCES = [
  'Facebook',
  'Messenger',
  'referral',
  'walk-in',
  'other'
]

export const URGENCY_OPTIONS = ['low', 'normal', 'urgent']

export const LEAD_STATUSES = [
  'new',
  'contacted',
  'estimated',
  'approved',
  'scheduled',
  'completed',
  'rejected'
]

export function createLeadDocument(input = {}) {
  const now = new Date().toISOString()

  return {
    _id: input._id || `lead:${crypto.randomUUID()}`,
    type: 'lead',
    customerName: input.customerName || '',
    phoneNumber: input.phoneNumber || '',
    facebookName: input.facebookName || '',
    location: input.location || '',
    serviceType: input.serviceType || 'mowing',
    inquirySource: input.inquirySource || 'Facebook',
    inquiryDate: input.inquiryDate || todayForInput(),
    description: input.description || '',
    lotSize: input.lotSize || '',
    grassHeight: input.grassHeight || '',
    urgency: input.urgency || 'normal',
    status: input.status || 'new',
    estimatedPrice: numberOrNull(input.estimatedPrice),
    finalPrice: numberOrNull(input.finalPrice),
    followUpDate: input.followUpDate || '',
    notes: input.notes || '',
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now
  }
}

export function updateLeadDocument(currentLead, changes) {
  return {
    ...currentLead,
    ...changes,
    type: 'lead',
    estimatedPrice: numberOrNull(changes.estimatedPrice ?? currentLead.estimatedPrice),
    finalPrice: numberOrNull(changes.finalPrice ?? currentLead.finalPrice),
    updatedAt: new Date().toISOString()
  }
}

export function getServiceLabel(serviceType) {
  return SERVICE_TYPES.find((option) => option.value === serviceType)?.label || 'Other'
}

export function generateReplyDraft(lead) {
  const service = getServiceLabel(lead.serviceType)
  const price = lead.estimatedPrice ? `₱${formatPeso(lead.estimatedPrice)}` : 'to be confirmed'
  const schedule = lead.followUpDate || 'your preferred schedule'

  return [
    'Hello, thank you for contacting E.D.S. - Espada Designs & Services.',
    '',
    `For your requested service: ${service}`,
    `Location: ${lead.location || 'to be confirmed'}`,
    `Estimated price: ${price}`,
    '',
    `We can schedule this on: ${schedule}`,
    '',
    'Please confirm if you would like to proceed. Thank you.'
  ].join('\n')
}

export function formatPeso(value) {
  return Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

function todayForInput() {
  return new Date().toISOString().slice(0, 10)
}

function numberOrNull(value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
