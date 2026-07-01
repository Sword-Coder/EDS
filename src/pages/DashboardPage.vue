<template>
  <q-page>
    <div class="page-shell">
      <header>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">A quick view of lead activity and estimated value.</p>
      </header>

      <div class="summary-grid">
        <q-card v-for="card in cards" :key="card.label" class="summary-card">
          <q-card-section>
            <div class="row items-center justify-between no-wrap">
              <div class="summary-card__label">{{ card.label }}</div>
              <q-icon :name="card.icon" color="primary" size="24px" />
            </div>
            <div class="summary-card__value">{{ card.value }}</div>
          </q-card-section>
        </q-card>
      </div>

      <q-banner v-if="!leadsStore.leads.length" class="q-mt-lg bg-blue-1 text-blue-10">
        No leads yet. Add your first lead from the Leads page to start tracking inquiries.
      </q-banner>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useLeadsStore } from '../stores/leads'
import { formatPeso } from '../models/lead'

const leadsStore = useLeadsStore()

onMounted(() => {
  leadsStore.loadLeads()
})

const cards = computed(() => {
  const summary = leadsStore.summary

  return [
    { label: 'Total leads', value: summary.totalLeads, icon: 'group' },
    { label: 'New inquiries', value: summary.newInquiries, icon: 'fiber_new' },
    { label: 'Needs follow-up', value: summary.needsFollowUp, icon: 'event' },
    { label: 'Estimates sent', value: summary.estimatesSent, icon: 'request_quote' },
    { label: 'Jobs approved', value: summary.jobsApproved, icon: 'check_circle' },
    { label: 'Jobs completed', value: summary.jobsCompleted, icon: 'task_alt' },
    { label: 'Total estimated value', value: `₱${formatPeso(summary.totalEstimatedValue)}`, icon: 'payments' }
  ]
})
</script>
