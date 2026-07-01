import { defineStore } from 'pinia'
import { generateReplyDraft, normalizeServiceType } from '../models/lead'

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
        .filter((lead) => {
          return state.serviceTypeFilter === 'all' || normalizeServiceType(lead.serviceType) === state.serviceTypeFilter
        })
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
    async loadLeads() {
      this.loading = true
      this.error = null

      try {
        this.leads = await apiRequest('/api/leads')
      } catch (error) {
        this.error = error.message || 'Could not load saved leads.'
      } finally {
        this.loading = false
      }
    },

    async addLead(input) {
      this.loading = true
      this.error = null

      try {
        const lead = await apiRequest('/api/leads', {
          method: 'POST',
          body: JSON.stringify(input)
        })

        this.leads = [lead, ...this.leads]
        return lead
      } catch (error) {
        this.error = error.message || 'Could not save lead.'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateLead(id, changes) {
      this.loading = true
      this.error = null

      try {
        const updatedLead = await apiRequest(`/api/leads/${encodeURIComponent(id)}`, {
          method: 'PUT',
          body: JSON.stringify(changes)
        })

        this.leads = this.leads.map((lead) => {
          return lead._id === id ? updatedLead : lead
        })

        return updatedLead
      } catch (error) {
        this.error = error.message || 'Could not update lead.'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteLead(id) {
      this.loading = true
      this.error = null

      try {
        await apiRequest(`/api/leads/${encodeURIComponent(id)}`, {
          method: 'DELETE'
        })

        this.leads = this.leads.filter((lead) => lead._id !== id)
      } catch (error) {
        this.error = error.message || 'Could not delete lead.'
        throw error
      } finally {
        this.loading = false
      }
    },

    setStatusFilter(status) {
      this.statusFilter = status
    },

    setServiceTypeFilter(serviceType) {
      this.serviceTypeFilter = serviceType
    },

    makeReplyDraft(lead) {
      return generateReplyDraft(lead)
    }
  }
})

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : null

  if (!response.ok) {
    throw new Error(payload?.error || `Request failed with status ${response.status}`)
  }

  return payload
}
