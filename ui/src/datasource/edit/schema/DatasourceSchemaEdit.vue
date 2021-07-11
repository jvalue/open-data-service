<template>
  <v-form
    v-model="isValid"
  >
    <v-card-actions>
      <div>
        <vue-slider 
          v-model="currentSliderValue"
          v-bind="sliderConfig.options"
          :data="sliderConfig.sliderData"
          :data-value="'name'"
          :data-label="'name'"
        />
      </div>
      <v-btn
        color="primary"
        class="ma-2"
        @click="onGenerate"
      >
        Generate schema
      </v-btn>      
    </v-card-actions>
    <v-textarea
      v-model="schemaAsText"
      label="Datasource schema suggestion"
      @keyup="formChanged"
    />
  </v-form>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import * as SchemaSuggestionREST from './../../schemaSuggestionRest'
import * as PreviewClient from '../../previewRest'
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/default.css'

import { Emit, PropSync } from 'vue-property-decorator'
import { requiredRule } from '../../../validators'
import DataSource from '../../datasource'
import { SliderConfig } from './slider/config'

@Component({ components: { VueSlider } })
export default class DatasourceSchemaEdit extends Vue {

  private isValid = true
  private required = requiredRule
  private currentSliderValue = '1'
  private sliderConfig = SliderConfig
  private schemaAsText = ''

  mounted (): void{
    if (this.dataSource.schema !== undefined) {
      this.schemaAsText = JSON.stringify(this.dataSource.schema)
    }
  }

  @PropSync('value')
  private dataSource!: DataSource

  @Emit('value')
  emitValue (): DataSource {
    return this.dataSource
  }

  @Emit('validityChanged')
  emitValid (): boolean {
    return this.isValid
  }

  formChanged (): void {
    this.emitValue()
    this.emitValid()
  }

  private async onGenerate (): Promise<void> {
    const preview = await PreviewClient.getPreview(this.dataSource)
    this.dataSource.schema = 
      await SchemaSuggestionREST.getSchema(JSON.stringify(preview), this.currentSliderValue)
    this.schemaAsText = JSON.stringify(this.dataSource.schema)
  }
}
</script>
