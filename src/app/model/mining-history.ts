export class MiningHistory{
    blockId:number;
    transactionIds:Array<string>;
    bountyShare:number;
    transactionTips:number;

    static create(blockId:number, transactionIds:Array<string> = [], bountyShare:number = 0, transactionTips:number = 0):MiningHistory{
        var miningHistory = new MiningHistory();
        miningHistory.blockId = blockId;
        miningHistory.transactionIds = transactionIds;
        miningHistory.bountyShare = bountyShare;
        miningHistory.transactionTips = transactionTips;
        return miningHistory;
    }
}