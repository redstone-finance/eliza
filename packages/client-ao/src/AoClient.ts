import { SearchMode } from "agent-twitter-client";
import { createDataItemSigner, dryrun, message } from "@permaweb/aoconnect";
import { AoSigner, NodeType } from "./ao_types.ts";
import {GQL_TX_QUERY, GQL_TXS_QUERY} from "./ao_graphql_query.ts";

export class AoClient {
    profileContractId: string;
    signer: AoSigner;

    constructor(profileContractId: string) {
        this.profileContractId = profileContractId;
    }

    async getMessage(messageId: string): Promise<NodeType> {
        console.log(`===== AO == getMessage`, messageId);
        const messageRes = await fetch(
            "https://arweave-search.goldsky.com/graphql",
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: GQL_TX_QUERY,
                    variables: {
                        id: messageId
                    },
                }),
            }
        ).then((res) => res.json());

        const message = messageRes.data.transaction;
        message.data.value = await this.getMessageData(messageId);

        console.log(`===== AO == message`, message);
        return message;
    }

    async getMessageData(messageId: string): Promise<string> {
        console.log(`===== AO == getMessageData`, messageId);
        const message = await fetch(`https://arweave.net/${messageId}`)
            .then((res) => res.text())
        console.log(`===== AO == message data`, message);
        return message;
    }

    async fetchIncomingMessages(count: number): Promise<NodeType[]> {
        console.log(`===== AO == getMessages`, this.profileContractId, count);
        const reqBody = {
            query: GQL_TXS_QUERY,
            variables: {
                cursor: "",
                entityId: this.profileContractId,
                limit: count,
                sortOrder: "INGESTED_AT_DESC",
            },
        };

        const messageResponse = await fetch(
            "https://arweave-search.goldsky.com/graphql",
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(reqBody),
            }
        ).then((res) => res.json());

        return messageResponse.data.transactions.edges
            .map((e) => e.node)
            .map((m) => {
                m.data.value = this.getMessageData(m.id);
                return m;
        });
    }

    fetchSearchMessages(
        query: string,
        maxTweets: number,
        searchMode: SearchMode,
        cursor: string
    ) {
        return undefined;
    }

    async fetchFollowingTimeline(count: number, param2: any[]) {
        return undefined;
    }

    async getUserMessages(id: string, count: number): Promise<Array<NodeType>> {
        return Promise.resolve(undefined);
    }

    async sendNoteTweet(content: string, tweetId: string) {
        return Promise.resolve(undefined);
    }

    async connect() {
        this.signer = createDataItemSigner(process.env.AO_WALLET);
    }

    async sendAoMessage(content: string, id: string): Promise<string> {
        const messageSent = await message({
            process: process.env.AO_MESSAGE_PROTOCOL_ID,
            tags: [
                { name: "Action", value: "Send-Message" },
                { name: "Message-Id", value: id },
            ],
            signer: this.signer,
            data: content,
        });

        return messageSent;
    }

    async likeTweet(id: string) {}

    async retweet(id: string) {}

    async sendQuoteTweet(quoteContent: string, id: string) {
        return Promise.resolve(undefined);
    }

    async setCookies(cookieStrings: string[]) {}

    async getProfile(username: string): Promise<AoFetchProfileResult> {
        const result = await dryrun({
            process: username,
            data: "1984",
            tags: [{ name: "Action", value: "Info" }],
        });
        const data = JSON.parse(result.Messages[0].Data);

        console.log(`Profile data`, data);
        return data;
    }
}

export interface AoFetchProfileResult {
    Assets: Array<string>;
    Owner: string;
    Collections: Array<string>;
    Profile: AoProfileResult;
}

export interface AoProfileResult {
    Version: string;
    ProfileImage: string;
    UserName: string;
    CoverImage: string;
    Description: string;
    DateUpdated: number;
    DisplayName: string;
    DateCreated: number;
}
