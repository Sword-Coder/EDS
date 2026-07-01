<template>
  <q-layout view="hHh Lpr lff">
    <q-header bordered class="bg-white text-dark">
      <q-toolbar>
        <q-btn
          flat
          round
          dense
          icon="menu"
          aria-label="Open navigation"
          @click="drawerOpen = !drawerOpen"
        />
        <q-avatar square size="36px" class="app-logo q-ml-sm">
          <img src="/eds-logo.png" alt="E.D.S. logo" />
        </q-avatar>
        <q-toolbar-title>E.D.S. Lead Management</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-if="drawerOpen"
      v-model="drawerOpen"
      bordered
      :width="248"
    >
      <q-list padding>
        <q-item-label header>Workspace</q-item-label>

        <q-item v-ripple clickable :to="{ name: 'dashboard' }" exact>
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-item v-ripple clickable :to="{ name: 'leads' }">
          <q-item-section avatar>
            <q-icon name="contacts" />
          </q-item-section>
          <q-item-section>Leads</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'

const drawerOpen = ref(true)
</script>
