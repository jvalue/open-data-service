<template>
  <div>
    <v-card class="mx-auto">
      <v-toolbar
        dense
        class="elevation-0"
      >
        <v-toolbar-title>
          Create New Datasource
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <datasource-form
          v-model="datasource"
          @validityChanged="(e) => isValid = e"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="error"
          class="ma-2"
          @click="onCancel"
        >
          Cancel
        </v-btn>
        <v-btn
          :disabled="!isValid"
          color="primary"
          class="ma-2"
          @click="onSave()"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import DatasourceForm from './DatasourceForm.vue'

import Datasource from './datasource'
import * as DatasourceREST from './datasourceRest'

const MINUTE = 60000
const HOUR = 3600000

@Component({
  components: { DatasourceForm }
})
export default class DatasourceCreate extends Vue {
  private datasource: Datasource = {
    id: -1,
    protocol: {
      type: 'HTTP',
      parameters: {
        location:
          'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json',
        encoding: 'UTF-8'
      }
    },
    format: {
      type: 'JSON',
      parameters: {}
    },
    metadata: {
      author: '',
      license: '',
      description: '',
      displayName: ''
    },
    trigger: {
      periodic: true,
      firstExecution: new Date(Date.now() + (10 * MINUTE)),
      interval: HOUR
    }
  }

  private isValid = false

  private onSave (): void {
    DatasourceREST.createDatasource(this.datasource)
      .then(this.routeToOverview)
      .catch(error => console.error('Failed to create datasource', error))
  }

  private onCancel (): void {
    this.routeToOverview()

  }

  private routeToOverview (): void {
    this.$router.push({ name: 'datasource-overview' })
      .catch(error => console.log('Failed to route to datasource-overview', error))
  }
}
</script>
