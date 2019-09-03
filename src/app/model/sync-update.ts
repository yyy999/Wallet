export class SyncUpdate{
    chainType: number; 
    currentBlockId: number;
    blockHeight: number; 
    percentage: number;
    estimatedTimeRemaining: string;

    private constructor(){}

    static create(chainType: number, currentBlockId: number, blockHeight: number, percentage: number, estimatedTimeRemaining: string){
        var update = new SyncUpdate();
        update.chainType = chainType;
        update.currentBlockId = currentBlockId;
        update.blockHeight = blockHeight;

        if(isNaN(percentage)){
            percentage = 0;
          }
        update.percentage = percentage;
        update.estimatedTimeRemaining = estimatedTimeRemaining;
        return update;
    }
  }
  
  export const NO_SYNC_UPDATE = <SyncUpdate>{
     chainType:0,
     currentBlockId:0,
     blockHeight:0,
     percentage:0,
     estimatedTimeRemaining: ''
    };