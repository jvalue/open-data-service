<template>
  <div class="datasource">
    <header class="d-flex mb-5">
      <h1>Datasources</h1>
      <v-spacer />
      <v-btn
        depressed
        @click="loadDataSources()"
      >
        <v-icon>
          mdi-sync
        </v-icon>
      </v-btn>
      <v-btn
        class="ml-2"
        color="primary"
        @click="onCreate()"
      >
        Create Datasource
      </v-btn>
    </header>
    <v-text-field
      v-model="search"
      class="mb-4"
      label="Search name"
      prepend-icon="mdi-magnify"
      hide-details
    />

    <v-data-table
      :headers="headers"
      :items="datasources"
      :single-expand="true"
      :search="search"
      :custom-filter="filterOnlyDisplayName"
      :loading="isLoadingDatasources && isLoadingDatasourcesStatus"
      show-expand
      class="elevation-3"
    >
      <v-progress-linear
        slot="progress"
        indeterminate
      />

      <template #[`item.trigger.periodic`]="{ item }">
        <v-simple-checkbox
          v-model="item.trigger.periodic"
          disabled
        />
      </template>

      <template #[`item.protocol.parameters.location`]="{ item }">
        {{ trimQueryParams(item.protocol.parameters.location) }}
      </template>

      <template #[`item.action`]="{ item }">
        <v-tooltip top>
          <template #activator="{ on, attrs }">
            <v-icon
              v-bind="attrs"
              small
              class="mr-2"
              v-on="on"
              @click="onCreatePipeline(item)"
            >
              mdi-pipe
            </v-icon>
          </template>
          <span>Create pipeline</span>
        </v-tooltip>
        <v-tooltip top>
          <template #activator="{ on, attrs }">
            <v-icon
              v-bind="attrs"
              small
              class="mr-2"
              v-on="on"
              @click="onEdit(item)"
            >
              mdi-pencil
            </v-icon>
          </template>
          <span>Edit</span>
        </v-tooltip>
        <v-tooltip top>
          <template #activator="{ on, attrs }">
            <v-icon
              v-bind="attrs"
              small
              v-on="on"
              @click="onDelete(item)"
            >
              mdi-delete
            </v-icon>
          </template>
          <span>Delete</span>
        </v-tooltip>
      </template>

      <template #[`item.health`]="{ item }">
        <v-icon
          small
          :color="datasourcesStatus.get(item.id)"
        >
          mdi-water
        </v-icon>
      </template>

      <template #expanded-item="{ headers, item }">
        <td
          class="pa-2"
          :colspan="headers.length"
        >
          <pre>{{ datasourceToJson(item) }}</pre>
        </td>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Datasource, { DataimportMetaData, HealthStatus } from './datasource'
import * as DatasourceREST from './datasourceRest'

@Component
export default class DatsourceOverview extends Vue {
  private isLoadingDatasources = false
  private isLoadingDatasourcesStatus = false
  private datasources: Datasource[] = []
  private datasourcesStatus: Map<number, string> = new Map<number, string>()
  

  private headers = [
    { text: 'Id', value: 'id' },
    { text: 'Name', value: 'metadata.displayName', sortable: false },
    { text: 'Author', value: 'metadata.author', sortable: false },
    { text: 'Location (URL)', value: 'protocol.parameters.location', sortable: false },
    { text: 'Periodic', value: 'trigger.periodic', sortable: false },
    { text: 'Actions', value: 'action', sortable: false },
    { text: 'Status', value: 'health', sortable: false},
    { text: '', value: 'data-table-expand' },
  ]
  
  private search = ''

  private async mounted (): Promise<void> {
    await this.loadDataSources().catch(error => console.error('Failed to load datasource', error))
    await this.loadDataSourcesStatus().catch(error => console.error('Failed to load datasource status', error))
  }

  private getHealthColor (status: HealthStatus): string {
    if (status === HealthStatus.OK) {
      return 'success'
    } else if (status === HealthStatus.WARINING) {
      return 'orange'
    } else {
      return 'red'
    }
  }

  private onCreate (): void {
    this.$router
      .push({ name: 'datasource-new' })
      .catch(error => console.log('Failed to route to datasource-new', error))
  }

  private onEdit (datasource: Datasource): void {
    this.$router
      .push({
        name: 'datasource-edit',
        params: { datasourceId: `${datasource.id}` },
      })
      .catch(error => console.log('Failed to route to datasource-edit', error))
  }

  private async onDelete (datasource: Datasource): Promise<void> {
    await DatasourceREST.deleteDatasource(datasource.id)
    await this.loadDataSources()
  }

  private onCreatePipeline (datasource: Datasource): void {
    this.$router
      .push({
        name: 'pipeline-new',
        params: { datasourceId: `${datasource.id}` },
      })
      .catch(error => console.log('Failed to route to pipeline-new', error))
  }

  private filterOnlyDisplayName (value: unknown, search: string, item: Datasource): boolean {
    return (
      value != null &&
      search != null &&
      typeof value === 'string' &&
      item.metadata.displayName.toLocaleLowerCase().includes(search.toLocaleLowerCase())
    )
  }

  private async loadDataSources (): Promise<void> {
    this.isLoadingDatasources = true
    this.datasources = await DatasourceREST.getAllDatasources()
    this.isLoadingDatasources = false
  }

  private async loadDataSourcesStatus (): Promise<void> {
    this.isLoadingDatasourcesStatus = true
    const datasourcesStatus: Map<number, string> = new Map<number, string>()

    for (const element of this.datasources ) {
      const dataImport: DataimportMetaData = await DatasourceREST.getLatestDataimport(element.id)
      datasourcesStatus.set(element.id, this.getHealthColor(dataImport.health))
    }

    this.datasourcesStatus = datasourcesStatus
    this.isLoadingDatasourcesStatus = false
  }

  private datasourceToJson (datasource: Datasource): string {
    return JSON.stringify(datasource, null, 2)
  }

  private trimQueryParams (url: string): string {
    const queryParamRegex = /\?.*/

    const urlContainsQueryParams = queryParamRegex.test(url)

    if (urlContainsQueryParams) {
      return url.replace(queryParamRegex, '') + '...'
    }
    
    return url
  }
}
</script>
<style>
td {
  word-break: break-all !important;
}

pre {
    white-space: pre-wrap;
}
</style>
