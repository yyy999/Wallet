import { HubConnection } from "@aspnet/signalr";
import { TotalNeuralium } from "../..//model/total-neuralium";
import { CommonCall } from "./commonCall";
import { LogService } from "../..//service/log.service";
import { TimelineEntry, TimelineDay, TimelineHeader, EntryDirection, EntryCreditType } from "../..//model/timeline";
import { NeuraliumTransaction, TransactionStatuses, TransactionVersion, TransactionType } from "../..//model/transaction";

export class NeuraliumCall extends CommonCall {

    private constructor(
        connection: HubConnection,
        logService: LogService) {
        super(connection, logService);
    }

    static create(
        connection: HubConnection,
        logService: LogService) {
        return new NeuraliumCall(connection, logService);
    }

    callQueryAccountTotalNeuraliums(accountUuid: string): Promise<TotalNeuralium> {
        return new Promise<TotalNeuralium>((resolve, reject) => {
 
                this.logEvent("QueryAccountTotalNeuraliums - call", { 'accountUuid': accountUuid });
                this.connection.invoke<object>("QueryAccountTotalNeuraliums", accountUuid)
                    .then(
                        response => {
                            this.logEvent("QueryAccountTotalNeuraliums - response", response);
                            var total = Number(response["Total"]);
                            var debit = Number(response["ReservedDebit"]);
                            var credit = Number(response["ReservedCredit"]);
                            var frozen = Number(response["Frozen"]);
                            resolve(TotalNeuralium.create(total, credit, debit, frozen));
                        })
                    .catch(reason => {
                        reject("QueryAccountTotalNeuraliums error : " + reason);
                    });
            });
    }

    callSendNeuraliums(targetAccountId: string, amount: number, fees: number, note: string = ""): Promise<number> {
        return new Promise<number>((resolve, reject) => {

                this.logEvent("sendNeuraliums - call", { 'targetAccountId': targetAccountId, 'amount': amount, 'fees': fees });
                this.connection.invoke<number>("SendNeuraliums", targetAccountId, amount, fees, note)
                    .then(
                        response => {
                            this.logEvent("sendNeuraliums - response", response);
                            resolve(response);
                        })
                    .catch(reason => {
                        reject("Send Neuraliums error : " + reason);
                    });
            });
    }

    callQueryNeuraliumTimelineHeader(accountUuid: string): Promise<TimelineHeader> {


        return new Promise<TimelineHeader>((resolve, reject) => {
            if(accountUuid == undefined){
                reject();
            }

                this.logEvent("QueryNeuraliumTimelineHeader - call", { accountUuid });
                this.connection.invoke<Array<object>>("QueryNeuraliumTimelineHeader", accountUuid)
                    .then(
                        response => {
                            this.logEvent("QueryNeuraliumTimelineHeader - response", response);
                            var firstDay = new Date(response["FirstDay"]);
                            var numberOfDays = <number>Number(response["NumberOfDays"]);
                            var header = TimelineHeader.create(numberOfDays, firstDay);
                            resolve(header);
                        })
                    .catch(reason => {
                        reject("QueryNeuraliumTimelineHeader error : " + reason);
                    });
            });

    }

    createTimelineDayForTest(date: string): TimelineDay {
        var timelineDay = TimelineDay.create(new Date(Date.parse(date)), 1, 20.2365);
        var entryWithTransaction = TimelineEntry.create("1",new Date(Date.parse(date + " 17:40:00")), "SF", "SG", 10.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true);
        entryWithTransaction.Transaction = new NeuraliumTransaction("123456","456",new Date(Date.now()),new TransactionVersion(TransactionType.DEBUG,1,1),null,TransactionStatuses.Confirmed,true,"notation","789",500,5);
        timelineDay.Entries.push(entryWithTransaction);
        timelineDay.Entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 15:30:00")), "SF", "SG", 10.256458, 0.000025, 0, EntryDirection.credit, EntryCreditType.transaction, true));
        timelineDay.Entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 15:45:00")),"SF", "SG", 10.256458, 0.000025, 0, EntryDirection.credit, EntryCreditType.election, true));
        timelineDay.Entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 16:00:00")), "SF", "SG", 10.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        timelineDay.Entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 16:30:00")), "SF", "SG", 0.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        timelineDay.Entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 16:45:00")),"SF", "SG", 10.256458, 0.000025, 0, EntryDirection.credit, EntryCreditType.election, true));
        timelineDay.Entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 17:00:00")), "SF", "SG", 10.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        timelineDay.Entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 17:30:00")),"SF", "SG", 0.256458, 0.000025, 0, EntryDirection.credit, EntryCreditType.transaction, true));
        timelineDay.Entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 17:45:00")),"SF", "SG", 10.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        timelineDay.Entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 15:45:00")),"SF", "SG", 10.256458, 0.000025, 0, EntryDirection.credit, EntryCreditType.election, true));
        timelineDay.Entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 16:00:00")), "SF", "SG", 10.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        timelineDay.Entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 16:30:00")), "SF", "SG", 0.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        timelineDay.Entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 16:45:00")),"SF", "SG", 10.256458, 0.000025, 0, EntryDirection.credit, EntryCreditType.election, true));
        timelineDay.Entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 17:00:00")), "SF", "SG", 10.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        timelineDay.Entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 17:30:00")), "SF", "SG", 0.256458, 0.000025, 0, EntryDirection.credit, EntryCreditType.transaction, true));
        timelineDay.Entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 17:45:00")),"SF", "SG", 10.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        timelineDay.Entries = timelineDay.Entries.sort((a, b) => { return b.Timestamp.getTime() - a.Timestamp.getTime() });
        return timelineDay;
    }

    callQueryNeuraliumTimelineSection(accountUuid: string, firstday: Date, skip: number, take: number): Promise<Array<TimelineDay>> {
        
        // return new Promise<Array<TimelineDay>>((resolve, reject) => {
        //     var list = new Array<TimelineDay>();
        //     list.push(this.createTimelineDayForTest("05/22/2019"));
        //     list.push(this.createTimelineDayForTest("05/23/2019"));
        //     list.push(this.createTimelineDayForTest("05/24/2019"));
        //     list.push(this.createTimelineDayForTest("05/25/2019"));
        //     list.push(this.createTimelineDayForTest("05/26/2019"));
        //     list.push(this.createTimelineDayForTest("05/27/2019"));
        //     list.push(this.createTimelineDayForTest("05/28/2019"));
        //     list.push(this.createTimelineDayForTest("05/29/2019"));
        //     list.push(this.createTimelineDayForTest("05/30/2019"));
        //     resolve(list.slice(skip,skip+take));
        // });
        

        return new Promise<Array<TimelineDay>>((resolve, reject) => {

                this.logEvent("QueryNeuraliumTimelineSection - call", { accountUuid, firstday, skip, take });
                this.connection.invoke<Array<object>>("QueryNeuraliumTimelineSection", accountUuid, firstday, skip, take)
                    .then(
                        response => {
                            this.logEvent("QueryNeuraliumTimelineSection - response", response);
                            var list = new Array<TimelineDay>();
                            response.forEach(element => {
                                var Day = new Date(element["Day"]);
                                var Id = <number>Number(element["Id"]);
                                var EndingTotal = <number>Number(element["EndingTotal"]);

                                var timelineDay = TimelineDay.create(Day, Id, EndingTotal);
                                var Entries = <Array<any>>element["Entries"];
                                Entries.forEach(item => {
                                    var TransactionId = item["TransactionId"];
                                    var Timestamp = new Date(item["Timestamp"]);
                                    var SenderAccountId = item["SenderAccountId"];
                                    var RecipientAccountId = item["RecipientAccountId"];
                                    var Amount = <number>Number(item["Amount"]);
                                    var Tips = <number>Number(item["Tips"]);
                                    var Total = <number>Number(item["Total"]);
                                    var Direction = <EntryDirection>Number(item["Direction"]);
                                    var CreditType = <EntryCreditType>Number(item["CreditType"]);
                                    var Confirmed = <boolean>Boolean(item["Confirmed"]);
                                    var Entry = TimelineEntry.create(TransactionId,Timestamp, SenderAccountId, RecipientAccountId, Amount, Tips, Total, Direction, CreditType, Confirmed);
                                    timelineDay.Entries.push(Entry);
                                });
                                // sort from youngest to oldest
                                timelineDay.Entries = timelineDay.Entries.sort((a, b) => { return b.Timestamp.getTime() - a.Timestamp.getTime() });
                                list.push(timelineDay);
                            });
                            resolve(list);
                        })
                    .catch(reason => {
                        reject("QueryNeuraliumTimelineSection error : " + reason);
                    });
            });

    }
    
}