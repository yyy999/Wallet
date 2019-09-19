import { NeuraliumTransaction, NO_TRANSACTION, NO_NEURALIUM_TRANSACTION } from "./transaction";

export enum EntryType {
    debit = 0,
    credit = 1,
    mining = 2
}

export enum EntryDirection {
    debit = 1,
    credit = 2
}

export enum EntryCreditType {
    none = 0,
    transaction = 1,
    election = 2
}

export class TimelineHeader {
    NumberOfDays: number;
    FirstDay: Date;

    private constructor() { }

    static create(numberOfDays: number, firstDay: Date) {
        var header = new TimelineHeader();
        header.NumberOfDays = numberOfDays;
        header.FirstDay = firstDay;
        return header;
    }
}

export class TimelineDay {
    Day: Date;
    Id: number;
    EndingTotal: number;
    Entries: Array<TimelineEntry>;

    private constructor() { }

    static create(day: Date, id: number, endingTotal: number) {
        var timelineDay = new TimelineDay();
        timelineDay.Day = day;
        timelineDay.Id = id;
        timelineDay.EndingTotal = endingTotal;
        timelineDay.Entries = new Array<TimelineEntry>();
        return timelineDay;
    }
}

export class TimelineEntry {
    TransactionId:string;
    Timestamp: Date;
    SenderAccountId: string;
    RecipientAccountId: string;
    Amount: number;
    Tips: number;
    Total: number;
    Type: EntryType;
    Confirmed: boolean;
    Transaction: NeuraliumTransaction = NO_NEURALIUM_TRANSACTION;
    ShowDetails:boolean = false;
    LightState:string = "open";
    DetailsState:string = "close";

    private constructor() { }

    get showTransaction():boolean{
        return this.ShowDetails && this.Transaction != null && this.Transaction != NO_NEURALIUM_TRANSACTION;
    }

    static create(transactionId:string, timestamp: Date, senderAccountId: string, recipientAccountId: string,
        amount: number, tips: number, total: number, direction: EntryDirection, creditType: EntryCreditType, confirmed: boolean) {
        var timelineEntry = new TimelineEntry();
        timelineEntry.TransactionId = transactionId;
        timelineEntry.Timestamp = timestamp;
        timelineEntry.SenderAccountId = senderAccountId;
        timelineEntry.RecipientAccountId = recipientAccountId;
        timelineEntry.Amount = amount;
        timelineEntry.Tips = tips;
        timelineEntry.Total = total;
        if (direction == EntryDirection.debit) {
            timelineEntry.Type = EntryType.debit;
        }
        else {
            switch (creditType) {
                case EntryCreditType.election:
                    timelineEntry.Type = EntryType.mining;
                    break;
                default:
                    timelineEntry.Type = EntryType.credit;
                    break;
            }
        };
        timelineEntry.Confirmed = confirmed;
        timelineEntry.Transaction = null;
        return timelineEntry;
    }
}