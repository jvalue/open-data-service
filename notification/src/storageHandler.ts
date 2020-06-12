import { SlackConfig, WebHookConfig, FirebaseConfig } from './interfaces/notificationConfig';
import { Connection, ConnectionOptions, createConnection, getConnection } from 'typeorm';
import { NotificationSummary} from './interfaces/notificationSummary';

/**=============================================================================================================
 * This class handles Requests to the Nofification Database
 * in order to store and get Notification Configurations.
 *==============================================================================================================*/
export class StorageHandler {

    constructor() {

    }
    /**===========================================================================================
     * Initializes a Database Connection to the notification-db service (postgres)
     * by using the Environment variables:
     *          - PGHOST:       IP/hostname of the storage service
     *          - PGPORT:       PORT        of the storage service
     *          - PGPASSWORD:   PASSWORD to connect to the stprage db
     *          - PGUSER:       USER     to connect to the storage db
     *
     * @param retries:  Number of retries to connect to the database
     * @param backoff:  Time in seconds to backoff before next connection retry
     *
     * @returns     a Promise, containing either a Connection on success or null on failure
     *===========================================================================================*/
    public async initConnection(retries: number, backoff: number): Promise<Connection | null> {
        var dbCon: null | Connection = null
        var established: boolean = false

        const options: ConnectionOptions = {
            type: "postgres",
            host: process.env.PGHOST,
            port: +process.env.PGPORT!,
            username: process.env.PGUSER,
            password: process.env.PGPASSWORD,
            database: process.env.PGUSER,
            synchronize: true,
            // logging: true,
            entities: [
                WebHookConfig,
                SlackConfig,
                FirebaseConfig
            ]
        }

        // try to establish connection
        for (let i = 0; i < retries; i++) {
            dbCon = await createConnection(options).catch(() => { return null })

            if (!dbCon) {
                console.warn(`DB Connection could not be initialized. Retrying in ${backoff} seconds`)
                await this.backOff(backoff);
            } else {
                established = true
                break;
            }
        }

        if (established) {
            console.log('Connection established')
        } else {
            console.error('Connection could not be established.')
        }

        return dbCon
    }

    /**====================================================================
     * Waits for a specific time period
     *
     * @param backOff   Period to wait in seconds
     *====================================================================*/
    private backOff(backOff: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, backOff * 1000));
    }

    /**
     *
     * @param pipelineId
     */
    public async getConfigsForPipeline(pipelineId: number): Promise<NotificationSummary> {
        console.log(`Getting ConfigSummary for Pipeline with id ${pipelineId}.`)

        const notificationSummary = new NotificationSummary

        const slackConfigs = await this.getSlackConfigs(pipelineId)
        const webHookConfigs = await this.getWebHookConfigs(pipelineId)
        const firebaseConfig = await this.getFirebaseConfigs(pipelineId)

        notificationSummary.slack = slackConfigs
        notificationSummary.webhook = webHookConfigs
        notificationSummary.firebase = firebaseConfig

        return notificationSummary
        // // wait for the Configs to be received from DB
        // await Promise.all([webHookConfigs, slackConfigs, firebaseConfig]).then(configs => {

        //     if (!configs || !configs[0] || !configs[1] || !configs[2]) {
        //         console.error('Could not get Configs from database.')
        //         return null
        //     }

        //     notificationSummary.webhook = configs[0] as WebHookConfig[]
        //     notificationSummary.slack = configs[1] as SlackConfig[]
        //     notificationSummary.firebase = configs[2] as FirebaseConfig[]


        //     // return notificationSummary
        //     return configs
        // })

    }
    /**===========================================================================================
     * Gets all Slack Config from the database for a specific pipeline id
     *
     * @param pipelineId    Pipeline ID to get the Slack Configs for
     *============================================================================================*/
    public async getSlackConfigs(pipelineId: number): Promise<SlackConfig[]> {
        console.log(`Getting Slack Configs with pipelineId ${pipelineId} from Database`)
        var slackConfigList: SlackConfig[] = []

        // Get Configs from Database
        try {
            const repository = getConnection().getRepository(SlackConfig)
            slackConfigList = await repository.find({ pipelineId: pipelineId })
        } catch (error) {
            console.log(error)
            Promise.reject(error)
        }
        console.log(`Sucessfully got ${slackConfigList.length} Slack config(s) from Database`)
        return slackConfigList
    }

    /**===========================================================================================
     * Gets all WebHook Configs from the database for a specific pipeline id
     *
     * @param pipelineId    Pipeline ID to get the WebHook Configs for
     *============================================================================================*/
    public async getWebHookConfigs(pipelineId: number): Promise<WebHookConfig[]> {
        console.log(`Getting WebHook Configs with pipelineId ${pipelineId} from Database`)
        var webHookConfigs: WebHookConfig[] = []

        // Get Configs from Database
        try {
            const repository = getConnection().getRepository(WebHookConfig)
            webHookConfigs = await repository.find({ pipelineId: pipelineId })
        } catch (error) {
            console.log(error)
            Promise.reject(error)
        }
        console.log(`Sucessfully got ${webHookConfigs.length} WebhookConfigs from Database`)
        return webHookConfigs
    }

    /**===========================================================================================
     * Gets all Firebase Configs from the database for a specific pipeline id
     *
     * @param pipelineId    Pipeline ID to get the Firebase Configs for
     *============================================================================================*/
    public async getFirebaseConfigs(pipelineId: number): Promise<FirebaseConfig[]> {
        console.log(`Getting Firebase Configs with pipelineId ${pipelineId} from Database`)

        var firebaseConfigs: FirebaseConfig[] = []

        // Get Configs from Database
        try {
            const repository = getConnection().getRepository(FirebaseConfig)
            firebaseConfigs = await repository.find({ pipelineId: pipelineId })
        } catch (error) {
            console.log(error)
            Promise.reject(error)
        }
        console.log(`Sucessfully got ${firebaseConfigs.length} Firebase configs from Database`)
        return firebaseConfigs
    }

    /**===============================================================
     * TODO: Document
     *
     *===============================================================*/
    public saveWebhookConfig(webhookConfig: WebHookConfig): boolean{

        // Init Repository for WebHook Config
        console.debug("Init Repository")
        const postRepository = getConnection().getRepository(WebHookConfig)

        // create object from Body of the Request (=WebHookConfig)
        console.debug("Init Webhook config")
        webhookConfig = postRepository.create(webhookConfig)

        // persist the Config
        console.debug("Save WebHookConfig to Repository")
        postRepository.save(webhookConfig);
        console.log("Webhook config persisted")

        return true
    }

    /**===============================================================
     * TODO: Document
     *
     *===============================================================*/
    public saveSlackConfig(slackConfig: SlackConfig): boolean {
        // Init Repository for Slack Config
        console.debug("Init Repository")
        const postRepository = getConnection().getRepository(SlackConfig)

        // create object from Body of the Request (=SlackConfig)
        console.debug("Init SlackConfig")
        slackConfig = postRepository.create(slackConfig)

        // persist the Config
        console.debug("Save SlackConfig to Repository")
        postRepository.save(slackConfig);
        console.log("Slack config persisted")

        return true
    }

    /**===============================================================
     * TODO: Document
     *
     *===============================================================*/
    public saveFirebaseConfig(firebaseConfig: FirebaseConfig): boolean {
        // Init Repository for Slack Config
        console.debug("Init Repository")
        const postRepository = getConnection().getRepository(FirebaseConfig)

        // create object from Body of the Request (=FirebaseConfig)
        console.debug("Init FirebaseConfig")
        firebaseConfig = postRepository.create(firebaseConfig)


        // persist the Config
        console.debug("Save FireBase config to Repository")
        postRepository.save(firebaseConfig);
        console.log("FireBase config persisted")

        return true
    }

}
