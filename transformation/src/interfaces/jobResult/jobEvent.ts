/**
 * This interface represents a Transformation Job that can be consumed from
 * a channel.
 * 
 * It contains
 * 
 * @field pipelineId       pipeline ID of the request
 * @field func             function to apply to the data (-> transformation) 
 * @field data             data to be transformed
 */
export default interface JobEvent {
    pipelineId: number      // pipeline ID of the request

    data: object;           // data to be transformed

    dataLocation: string    // data location
}
