<template>
  <div class="pipeline">
    <v-card>
      <v-card-title>
        <v-btn
          class="ma-2"
          color="success"
          @click="onCreatePipeline()"
        >
          Create new pipeline
          <v-icon
            dark
            right
          >
            mdi mdi-pipe
          </v-icon>
        </v-btn>
        <v-btn
          class="ma-2"
          @click="loadPipelineStatesAction()"
        >
          <v-icon dark>
            mdi mdi-sync
          </v-icon>
        </v-btn>
        <v-spacer />
        <v-text-field
          v-model="search"
          label="Search"
          append-icon="mdi mdi-magnify"
          single-line
          hide-details
        />
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="pipelines"
        :search="search"
        :custom-filter="filterOnlyDisplayName"
        :loading="isLoadingPipelines && isLoadingPipelineStates"
        class="elevation-1"
      >
        <v-progress-linear
          slot="progress"
          indeterminate
        />

        <template #[`item.trigger.interval`]="{ item }">
          {{ getHoursFromMS(item.trigger.interval) }}h:{{ getMinutesFromMS(item.trigger.interval) }}m
        </template>

        <template #[`item.trigger.periodic`]="{ item }">
          <v-switch
            v-model="item.trigger.periodic"
            class="ma-2"
            disabled
          />
        </template>

        <template #[`item.action`]="{ item }">
          <v-btn
            depressed
            small
            class="ma-2"
            @click="onShowPipelineData(item)"
          >
            Data
            <v-icon
              dark
              right
            >
              mdi mdi-database
            </v-icon>
          </v-btn>
          <v-btn
            depressed
            small
            class="ma-2"
            @click="onEditPipeline(item)"
          >
            Edit
            <v-icon
              dark
              right
            >
              mdi mdi-pencil
            </v-icon>
          </v-btn>
          <v-btn
            depressed
            small
            class="ma-2"
            @click="onDeletePipeline(item)"
          >
            Delete
            <v-icon
              dark
              right
            >
              mdi mdi-delete
            </v-icon>
          </v-btn>
          <v-btn
            depressed
            small
            class="ma-2"
            @click="onNotifications(item)"
          >
            Notifications
            <v-icon
              dark
              right
            >
              mdi mdi-alarm
            </v-icon>
          </v-btn>
        </template>

        <template #[`item.health`]="{ item }">
          <v-icon
            small
            :color="pipelineStates.get(item.id)"
          >
            mdi-water
          </v-icon>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { State, Action } from 'vuex-class'
import Pipeline from './pipeline'

const namespace = { namespace: 'pipeline' }

@Component({})
export default class PipelineOverview extends Vue {
  @Action('loadPipelines', namespace) private loadPipelinesAction!: () => Promise<void>
  @Action('loadPipelineStates', namespace) private loadPipelineStatesAction!: () => Promise<void>
  @Action('deletePipeline', namespace) private deletePipelineAction!: (id: number) => void

  @State('isLoadingPipelines', namespace) private isLoadingPipelines!: boolean
  @State('isLoadingPipelineStates', namespace) private isLoadingPipelineStates!: boolean
  @State('pipelines', namespace) private pipelines!: Pipeline[]
  @State('pipelineStates', namespace) private pipelineStates!: Map<number, string>


  private headers = [
    { text: 'Id', value: 'id' },
    { text: 'Datasource ID', value: 'datasourceId' },
    { text: 'Pipeline Name', value: 'metadata.displayName', sortable: false }, // sorting to be implemented
    { text: 'Author', value: 'metadata.author', sortable: false },
    { text: 'Action', value: 'action', sortable: false },
    { text: 'Status', value: 'health', sortable: false }
  ]

  private search = ''

  private async mounted (): Promise<void> {
    await this.loadPipelinesAction()
    await this.loadPipelineStatesAction()
  }

  private onShowPipelineData (pipeline: Pipeline): void {
    this.$router.push({ name: 'pipeline-storage-overview', params: { storageId: `${pipeline.id}` } })
      .catch(error => console.log('Failed to route to pipeline-storage-overview', error))
  }

  private onCreatePipeline (): void {
    this.$router.push({ name: 'pipeline-new' })
      .catch(error => console.log('Failed to route to pipeline-new', error))
  }

  private onEditPipeline (pipeline: Pipeline): void {
    this.$router.push({ name: 'pipeline-edit', params: { pipelineId: `${pipeline.id}` } })
      .catch(error => console.log('Failed to route to pipeline-edit', error))
  }

  private onDeletePipeline (pipeline: Pipeline): void {
    this.deletePipelineAction(pipeline.id)
  }

  private onNotifications (pipeline: Pipeline): void {
    this.$router.push({ name: 'notification-overview', params: { pipelineId: `${pipeline.id}` } })
      .catch(error => console.log('Failed to route to notification-overview', error))
  }

  private filterOnlyDisplayName (value: unknown, search: string, item: Pipeline): boolean {
    return value != null &&
          search != null &&
          typeof value === 'string' &&
          item.metadata.displayName.toLocaleLowerCase().includes(search.toLocaleLowerCase())
  }
}
</script>
