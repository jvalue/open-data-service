import { validators } from '@jvalue/node-dry-basics'

export interface PipelineSuccessEvent {
  pipelineId: number
  pipelineName: string
  data: object
  schema: object
}

/**
 * Checks if this event is a valid pipeline success event,
 * by checking if all field variables exist and are set.
 *
 * @returns     true, if param event is a PipelineSuccessEvent, else false
 */
export function isValidPipelineSuccessEvent (event: unknown): event is PipelineSuccessEvent {
  return validators.isObject(event) &&
    validators.hasProperty(event, 'pipelineId') &&
    validators.hasProperty(event, 'pipelineName') &&
    validators.hasProperty(event, 'data')
}
