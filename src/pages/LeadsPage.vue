<template>
  <q-page>
    <div class="page-shell">
      <header class="row items-start justify-between q-gutter-md">
        <div>
          <h1 class="page-title">Leads</h1>
          <p class="page-subtitle">Track inquiries, estimates, statuses, and reply drafts.</p>
        </div>

        <q-btn color="primary" icon="add" label="Add lead" @click="openCreateDialog" />
      </header>

      <q-card class="work-surface">
        <q-banner v-if="leadsStore.error" class="bg-red-1 text-red-10">
          {{ leadsStore.error }}
        </q-banner>

        <q-card-section>
          <div class="toolbar-row">
            <q-select
              v-model="statusFilter"
              outlined
              dense
              emit-value
              map-options
              label="Status"
              :options="statusOptions"
            />

            <q-select
              v-model="serviceTypeFilter"
              outlined
              dense
              emit-value
              map-options
              label="Service type"
              :options="serviceTypeFilterOptions"
            />

            <q-btn flat icon="filter_alt_off" label="Clear" @click="clearFilters" />
          </div>
        </q-card-section>

        <q-separator />

        <q-table
          flat
          :rows="leadsStore.filteredLeads"
          :columns="columns"
          row-key="_id"
          :loading="leadsStore.loading"
          no-data-label="No leads match the current filters."
          :rows-per-page-options="[10, 25, 50]"
        >
          <template #body-cell-customerName="props">
            <q-td :props="props">
              <div class="text-weight-medium">{{ props.row.customerName || 'Unnamed lead' }}</div>
              <div class="text-caption text-grey-7">{{ props.row.phoneNumber || props.row.facebookName }}</div>
            </q-td>
          </template>

          <template #body-cell-serviceType="props">
            <q-td :props="props">
              <q-chip dense outline color="primary">
                {{ getServiceLabel(props.row.serviceType) }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <q-chip dense :color="statusColor(props.row.status)" text-color="white" class="status-chip">
                {{ props.row.status }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-estimatedPrice="props">
            <q-td :props="props">
              {{ props.row.estimatedPrice ? `₱${formatPeso(props.row.estimatedPrice)}` : '-' }}
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="q-gutter-xs">
              <q-btn dense flat round icon="chat" color="primary" @click="openReplyDialog(props.row)">
                <q-tooltip>Prepare reply draft</q-tooltip>
              </q-btn>
              <q-btn dense flat round icon="edit" color="primary" @click="openEditDialog(props.row)">
                <q-tooltip>Edit lead</q-tooltip>
              </q-btn>
              <q-btn dense flat round icon="delete" color="negative" @click="confirmDelete(props.row)">
                <q-tooltip>Delete lead</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <q-dialog v-model="formDialogOpen" persistent>
      <q-card style="width: min(780px, 96vw)">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">{{ editingLeadId ? 'Edit lead' : 'Add lead' }}</div>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-form @submit="saveLead">
          <q-card-section class="q-gutter-md">
            <div class="row q-col-gutter-md">
              <q-input v-model="form.customerName" class="col-12 col-md-6" outlined label="Customer name" />
              <q-input v-model="form.phoneNumber" class="col-12 col-md-6" outlined label="Phone number" />
              <q-input v-model="form.facebookName" class="col-12 col-md-6" outlined label="Facebook name" />
              <q-input v-model="form.location" class="col-12 col-md-6" outlined label="Location" />

              <q-select
                v-model="form.serviceType"
                class="col-12 col-md-6"
                outlined
                emit-value
                map-options
                label="Service type"
                :options="SERVICE_TYPES"
              />

              <q-select
                v-model="form.inquirySource"
                class="col-12 col-md-6"
                outlined
                label="Inquiry source"
                :options="INQUIRY_SOURCES"
              />

              <q-input v-model="form.inquiryDate" class="col-12 col-md-4" outlined type="date" label="Inquiry date" />

              <q-select
                v-model="form.urgency"
                class="col-12 col-md-4"
                outlined
                label="Urgency"
                :options="URGENCY_OPTIONS"
              />

              <q-select
                v-model="form.status"
                class="col-12 col-md-4"
                outlined
                label="Status"
                :options="LEAD_STATUSES"
              />

              <q-input v-model="form.lotSize" class="col-12 col-md-6" outlined label="Lot size" />
              <q-input v-model="form.grassHeight" class="col-12 col-md-6" outlined label="Grass height" />

              <q-input
                v-model.number="form.estimatedPrice"
                class="col-12 col-md-4"
                outlined
                type="number"
                min="0"
                label="Estimated price"
              />

              <q-input
                v-model.number="form.finalPrice"
                class="col-12 col-md-4"
                outlined
                type="number"
                min="0"
                label="Final price"
              />

              <q-input v-model="form.followUpDate" class="col-12 col-md-4" outlined type="date" label="Follow-up date" />

              <q-input
                v-model="form.description"
                class="col-12"
                outlined
                type="textarea"
                label="Description"
                autogrow
              />

              <q-input v-model="form.notes" class="col-12" outlined type="textarea" label="Notes" autogrow />
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn flat label="Cancel" v-close-popup />
            <q-btn color="primary" label="Save lead" type="submit" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="replyDialogOpen">
      <q-card style="width: min(680px, 96vw)">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6">Reply draft</div>
            <div class="text-caption text-grey-7">{{ selectedLead?.customerName || 'Selected lead' }}</div>
          </div>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-input
            v-model="replyDraft"
            outlined
            type="textarea"
            class="reply-preview"
            input-class="reply-preview"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" v-close-popup />
          <q-btn color="primary" icon="content_copy" label="Copy" @click="copyReplyDraft" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import {
  SERVICE_TYPES,
  INQUIRY_SOURCES,
  URGENCY_OPTIONS,
  LEAD_STATUSES,
  createLeadDocument,
  formatPeso,
  getServiceLabel
} from '../models/lead'
import { useLeadsStore } from '../stores/leads'

const $q = useQuasar()
const leadsStore = useLeadsStore()

const formDialogOpen = ref(false)
const replyDialogOpen = ref(false)
const editingLeadId = ref(null)
const selectedLead = ref(null)
const replyDraft = ref('')

const emptyForm = () => createLeadDocument()
const form = ref(emptyForm())

const columns = [
  { name: 'customerName', label: 'Customer', field: 'customerName', align: 'left', sortable: true },
  { name: 'serviceType', label: 'Service', field: 'serviceType', align: 'left', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'left', sortable: true },
  { name: 'location', label: 'Location', field: 'location', align: 'left', sortable: true },
  { name: 'estimatedPrice', label: 'Estimate', field: 'estimatedPrice', align: 'right', sortable: true },
  { name: 'followUpDate', label: 'Follow-up', field: 'followUpDate', align: 'left', sortable: true },
  { name: 'actions', label: '', field: 'actions', align: 'right' }
]

const statusOptions = computed(() => [
  { label: 'All statuses', value: 'all' },
  ...LEAD_STATUSES.map((status) => ({ label: labelize(status), value: status }))
])

const serviceTypeFilterOptions = computed(() => [
  { label: 'All services', value: 'all' },
  ...SERVICE_TYPES
])

const statusFilter = computed({
  get: () => leadsStore.statusFilter,
  set: (value) => leadsStore.setStatusFilter(value)
})

const serviceTypeFilter = computed({
  get: () => leadsStore.serviceTypeFilter,
  set: (value) => leadsStore.setServiceTypeFilter(value)
})

onMounted(() => {
  leadsStore.loadLeads()
})

function openCreateDialog() {
  editingLeadId.value = null
  form.value = emptyForm()
  formDialogOpen.value = true
}

function openEditDialog(lead) {
  editingLeadId.value = lead._id
  form.value = { ...lead }
  formDialogOpen.value = true
}

async function saveLead() {
  try {
    if (editingLeadId.value) {
      await leadsStore.updateLead(editingLeadId.value, form.value)
    } else {
      await leadsStore.addLead(form.value)
    }

    formDialogOpen.value = false
  } catch (error) {
    $q.notify({ type: 'negative', message: leadsStore.error || 'Could not save lead.' })
  }
}

function confirmDelete(lead) {
  $q.dialog({
    title: 'Delete lead?',
    message: `This will remove ${lead.customerName || 'this lead'} from the lead database.`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await leadsStore.deleteLead(lead._id)
    } catch (error) {
      $q.notify({ type: 'negative', message: leadsStore.error || 'Could not delete lead.' })
    }
  })
}

function openReplyDialog(lead) {
  selectedLead.value = lead
  replyDraft.value = leadsStore.makeReplyDraft(lead)
  replyDialogOpen.value = true
}

async function copyReplyDraft() {
  try {
    await navigator.clipboard.writeText(replyDraft.value)
    $q.notify({ type: 'positive', message: 'Reply draft copied.' })
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Could not copy reply draft.' })
  }
}

function clearFilters() {
  leadsStore.setStatusFilter('all')
  leadsStore.setServiceTypeFilter('all')
}

function statusColor(status) {
  const colors = {
    new: 'blue',
    contacted: 'teal',
    estimated: 'deep-orange',
    approved: 'green',
    scheduled: 'indigo',
    completed: 'positive',
    rejected: 'grey'
  }

  return colors[status] || 'grey'
}

function labelize(value) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}
</script>
