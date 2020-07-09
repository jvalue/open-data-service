import { connect, Connection, ConsumeMessage, Channel } from "amqplib/callback_api"
import { TriggerEventHandler } from "../triggerEventHandler";
import { TransformationEvent } from '../transformationEvent';

/**
 * This class handles the communication with the AMQP service (rabbitmq)
 * It interacts with this channels:
 *
 *      * Notification Channel:
 *       ----------------------
 *       A channel to notify the notification service that a transformation is done.
 *       (see TransformationEvent for details of the Event).
 *
 */
export class AmqpHandler{
    notifQueueName = process.env.AMQP_NOTIFICATION_QUEUE!     // Queue name of the Job Queue

    triggerEventHandler: TriggerEventHandler

    /**
     * Default constructor.
     *
     * @param storageHandler    StorageHandler to get corresponding notification configs
     * @param executor          Sandboxexecutor to run condition evaluations
     */
    constructor(triggerEventHandler: TriggerEventHandler) {
        this.triggerEventHandler = triggerEventHandler
    }

    /**
     * Connects to Amqp Service and initializes a channel
     *
     * @param retries   Number of retries to connect to the notification-config db
     * @param backoff   Time to wait until the next retry
     */
    public async connect(retries: number, backoff: number) {
        const rabbit_url = process.env.AMQP_SERVICE_HOST;
        const rabbit_usr = process.env.AMQP_SERVICE_USER;
        const rabbit_password = process.env.AMQP_SERVICE_PWD;
        const rabit_amqp_url = 'amqp://' + rabbit_usr + ':' + rabbit_password + '@' + rabbit_url;

        console.log("URL: " + rabit_amqp_url)

        var established: boolean = false    // amqp service connection result
        const handler: AmqpHandler = this   // for ability to access methods and members in callback
        let errMsg: string = ''             // Error Message to be shown after final retry

        for (let i = 1; i <= retries; i++) {
            await this.backOff(backoff)
            await connect(rabit_amqp_url, async function (error0: any, connection: Connection) {
                if (error0) {
                    errMsg = `Error connecting to RabbitMQ: ${error0}.Retrying in ${backoff} seconds`
                    console.info(`Connecting to Amqp handler (${i}/${retries})`);
                    return
                }
                established = true

                // create the channel
                await handler.initChannel(connection)
            })

            if (established) {
                break
            }
        }

        if (!established) {
            console.error(`Could not establish connection to Amqp Handler: ${errMsg}`)
        } else {
            console.info('Connected to amqpHandler')
        }
    }

    /**
     * Waits for a specific time period.
     *
     * @param backOff   Period to wait in seconds
     */
    private backOff(backOff: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, backOff * 1000));
    }

    private initChannel(connection: Connection) {
        console.log(`Initializing Transformation Channel "${this.notifQueueName}"`)

        connection.createChannel((error1: Error, channel: Channel) => {
            if (error1) {
                throw error1;
            }

            channel.assertQueue(this.notifQueueName, {
                durable: false,
            });

            // Consume from Channel
            channel.consume(
                this.notifQueueName,
                async (msg: ConsumeMessage | null) => await this.handleEvent(msg),
                { noAck: true }
            );
        });
        console.info(`Successfully initialized Transformation Channel "${this.notifQueueName}"`)
    }

    private async handleEvent(msg: ConsumeMessage | null): Promise<void> {
      if (!msg) {
        return Promise.reject('Could not receive Notification Event: Message is not set')
      }

      const eventMessage = JSON.parse(msg.content.toString())
      const transformationEvent = eventMessage as TransformationEvent

      console.log(`Received Event from Channel: Pipeline id: "${transformationEvent.pipelineId}",
      Pipeline Name: "${transformationEvent.pipelineName}`)

      return this.triggerEventHandler.handleEvent(transformationEvent)
    }
}


