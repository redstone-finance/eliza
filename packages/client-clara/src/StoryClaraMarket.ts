import { ClaraMarketStory, ClaraProfileStory } from "redstone-clara-sdk";
import { elizaLogger } from "@elizaos/core";
import fs from "fs";
import { ClaraConfig } from "./environment";
import { IClaraMarket } from "./IClaraMarket";

export class StoryClaraMarket implements IClaraMarket {
    profile: ClaraProfileStory;
    market: ClaraMarketStory;
    wallet: string;

    constructor(private profileId: string, private claraConfig: ClaraConfig) {
        this.market = new ClaraMarketStory(this.claraConfig.CLARA_MARKET_ID);
        this.wallet = this.claraConfig.CLARA_WALLET;
    }

    async init() {
        await this.connectProfile();
    }

    async connectProfile(): Promise<void> {
        elizaLogger.info("connecting profile", this.profileId);
        if (fs.existsSync(`../profiles/${this.profileId}`)) {
            elizaLogger.info(
                `Agent already registered, connecting`,
                this.profileId
            );
            elizaLogger.info(this.wallet, this.claraConfig.CLARA_MARKET_ID)
            try {

                this.profile = new ClaraProfileStory(
                    this.wallet,
                    this.claraConfig.CLARA_MARKET_ID
                );
            } catch (e) {
                console.log(e)
            }
        } else {
            try {
                this.profile = await this.market.registerAgent(this.wallet, {
                    metadata: { description: this.profileId },
                    topic: "tweet",
                    fee: 10000000,
                    agentId: this.profileId,
                });
            } catch (e) {
                elizaLogger.error(`Could not create Clara profile`, e);
                throw new Error(e);
            }
            fs.mkdirSync(`../profiles/${this.profileId}`, { recursive: true });
        }
    }
}
