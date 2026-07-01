import { defineStore } from 'pinia'
import {
  createLeadDocument,
  updateLeadDocument,
  generateReplyDraft
} from '../models/lead'

const STORAGE_KEY = 'eds.leads.v1'

export const useLeadsStore = defineStore('leads', {
  state: () => ({
    leads: [],
    loading: false,
    error: null,
    statusFilter: 'all',
    serviceTypeFilter: 'all'
  }),

  getters: {
    filteredLeads(state) {
      return state.leads
        .filter((lead) => state.statusFilter === 'all' || lead.status === state.statusFilter)
        .filter((lead) => state.serviceTypeFilter === 'all' || lead.serviceType === state.serviceTypeFilter)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    },

    summary(state) {
      const totalEstimatedValue = state.leads.reduce((total, lead) => {
        return total + Number(lead.estimatedPrice || 0)
      }, 0)

      return {
        totalLeads: state.leads.length,
        newInquiries: state.leads.filter((lead) => lead.status === 'new').length,
        needsFollowUp: state.leads.filter((lead) => {
          return lead.followUpDate && !['completed', 'rejected'].includes(lead.status)
        }).length,
        estimatesSent: state.leads.filter((lead) => lead.status === 'estimated').length,
        jobsApproved: state.leads.filter((lead) => lead.status === 'approved').length,
        jobsCompleted: state.leads.filter((lead) => lead.status === 'completed').length,
        totalEstimatedValue
      }
    }
  },

  actions: {
    loadLeads() {
      this.loading = true
      this.error = null

      try {
        const rawLeads = localStorage.getItem(STORAGE_KEY)
        this.leads = rawLeads ? JSON.parse(rawLeads) : []
      } catch (error) {
        this.error = 'Could not load saved leads.'
      } finally {
        this.loading = false
      }
    },

    addLead(input) {
      const lead = createLeadDocument(input)
      this.leads = [lead, ...this.leads]
      this.persist()
      return lead
    },

    updateLead(id, changes) {
      this.leads = this.leads.map((lead) => {
        return lead._id === id ? updateLeadDocument(lead, changes) : lead
      })
      this.persist()
    },

    deleteLead(id) {
      this.leads = this.leads.filter((lead) => lead._id !== id)
      this.persist()
    },

    setStatusFilter(status) {
      this.statusFilter = status
    },

    setServiceTypeFilter(serviceType) {
      this.serviceTypeFilter = serviceType
    },

    makeReplyDraft(lead) {
      return generateReplyDraft(lead)
    },

    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.leads))
      } catch (error) {
        this.error = 'Could not save leads on this device.'
      }
    }
  }
})
