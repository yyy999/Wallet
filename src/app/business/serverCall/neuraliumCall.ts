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
        super(connection, logService)
    }

    static create(
        connection: HubConnection,
        logService: LogService) {
        return new NeuraliumCall(connection, logService)
    }

    callQueryAccountTotalNeuraliums(accountUuid: string): Promise<TotalNeuralium> {
        return new Promise<TotalNeuralium>((resolve, reject) => {
            const cnx = this.connection;

            cnx.start().then(() => {
                this.logEvent("QueryAccountTotalNeuraliums - call", { 'accountUuid': accountUuid });
                cnx.invoke<object>("QueryAccountTotalNeuraliums", accountUuid)
                    .then(
                        response => {
                            this.logEvent("QueryAccountTotalNeuraliums - response", response);
                            var total = response["total"];
                            var debit = response["reservedDebit"];
                            var credit = response["reservedCredit"];
                            var frozen = response["frozen"];
                            resolve(TotalNeuralium.create(total, credit, debit, frozen));
                        })
                    .catch(reason => {
                        reject("QueryAccountTotalNeuraliums error : " + reason);
                    })
                    .finally(() => {
                        cnx.stop();
                    })
            }).catch(reason => {
                reject("Connection error : " + reason);
            })
        });
    }

    callSendNeuraliums(targetAccountId: string, amount: number, fees: number, note: string = ""): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            const cnx = this.connection;

            cnx.start().then(() => {
                this.logEvent("sendNeuraliums - call", { 'targetAccountId': targetAccountId, 'amount': amount, 'fees': fees });
                cnx.invoke<number>("sendNeuraliums", targetAccountId, amount, fees, note)
                    .then(
                        response => {
                            this.logEvent("sendNeuraliums - response", response);
                            resolve(response);
                        })
                    .catch(reason => {
                        reject("Send Neuraliums error : " + reason);
                    })
                    .finally(() => {
                        cnx.stop();
                    })
            }).catch(reason => {
                reject("Connection error : " + reason);
            })
        });
    }

    callQueryNeuraliumTimelineHeader(accountUuid: string): Promise<TimelineHeader> {
        
        // return new Promise<TimelineHeader>((resolve, reject) => {
        //     resolve(TimelineHeader.create(9, new Date(Date.parse("05/22/2019"))));
        // });
        

        return new Promise<TimelineHeader>((resolve, reject) => {
            if(accountUuid == undefined){
                reject();
            }

            const cnx = this.connection;

            cnx.start().then(() => {
                this.logEvent("QueryNeuraliumTimelineHeader - call", { accountUuid });
                cnx.invoke<Array<object>>("QueryNeuraliumTimelineHeader", accountUuid)
                    .then(
                        response => {
                            this.logEvent("QueryNeuraliumTimelineHeader - response", response);
                            var firstDay = new Date(response["firstDay"]);
                            var numberOfDays = <number>response["numberOfDays"];
                            var header = TimelineHeader.create(numberOfDays, firstDay);
                            resolve(header);
                        })
                    .catch(reason => {
                        reject("QueryNeuraliumTimelineHeader error : " + reason);
                    })
                    .finally(() => {
                        cnx.stop();
                    })
            }).catch(reason => {
                reject("Connection error : " + reason);
            })
        });

    }

    createTimelineDayForTest(date: string): TimelineDay {
        var timelineDay = TimelineDay.create(new Date(Date.parse(date)), 1, 20.2365);
        var entryWithTransaction = TimelineEntry.create("1",new Date(Date.parse(date + " 17:40:00")), 1, 2, 10.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true);
        entryWithTransaction.transaction = new NeuraliumTransaction("123456","456",new Date(Date.now()),new TransactionVersion(TransactionType.DEBUG,1,1),null,TransactionStatuses.Confirmed,true,"notation","789",500,5);
        timelineDay.entries.push(entryWithTransaction);
        timelineDay.entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 15:30:00")), 2, 1, 10.256458, 0.000025, 0, EntryDirection.credit, EntryCreditType.transaction, true));
        timelineDay.entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 15:45:00")), 1, 1, 10.256458, 0.000025, 0, EntryDirection.credit, EntryCreditType.election, true));
        timelineDay.entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 16:00:00")), 1, 2, 10.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        timelineDay.entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 16:30:00")), 2, 1, 10.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        timelineDay.entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 16:45:00")), 1, 1, 10.256458, 0.000025, 0, EntryDirection.credit, EntryCreditType.election, true));
        timelineDay.entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 17:00:00")), 1, 2, 10.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        timelineDay.entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 17:30:00")), 2, 1, 10.256458, 0.000025, 0, EntryDirection.credit, EntryCreditType.transaction, true));
        timelineDay.entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 17:45:00")), 1, 1, 10.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        timelineDay.entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 15:45:00")), 1, 1, 10.256458, 0.000025, 0, EntryDirection.credit, EntryCreditType.election, true));
        timelineDay.entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 16:00:00")), 1, 2, 10.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        timelineDay.entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 16:30:00")), 2, 1, 10.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        timelineDay.entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 16:45:00")), 1, 1, 10.256458, 0.000025, 0, EntryDirection.credit, EntryCreditType.election, true));
        timelineDay.entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 17:00:00")), 1, 2, 10.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        timelineDay.entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 17:30:00")), 2, 1, 10.256458, 0.000025, 0, EntryDirection.credit, EntryCreditType.transaction, true));
        timelineDay.entries.push(TimelineEntry.create("1",new Date(Date.parse(date + " 17:45:00")), 1, 1, 10.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        timelineDay.entries = timelineDay.entries.sort((a, b) => { return b.timestamp.getTime() - a.timestamp.getTime() });
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
            const cnx = this.connection;

            cnx.start().then(() => {
                this.logEvent("QueryNeuraliumTimelineSection - call", { accountUuid, firstday, skip, take });
                cnx.invoke<Array<object>>("QueryNeuraliumTimelineSection", accountUuid, firstday, skip, take)
                    .then(
                        response => {
                            this.logEvent("QueryNeuraliumTimelineSection - response", response);
                            var list = new Array<TimelineDay>();
                            response.forEach(element => {
                                var day = new Date(element["day"]);
                                var id = <number>element["id"];
                                var endingTotal = <number>element["endingTotal"];

                                var timelineDay = TimelineDay.create(day, id, endingTotal);
                                var entries = <Array<any>>element["entries"];
                                entries.forEach(item => {
                                    var transactionId = item["transactionId"];
                                    var timestamp = new Date(item["timestamp"]);
                                    var senderAccountId = <number>item["senderAccountId"];
                                    var recipientAccountId = <number>item["recipientAccountId"];
                                    var amount = <number>item["amount"];
                                    var tips = <number>item["tips"];
                                    var total = <number>item["total"];
                                    var direction = <number>item["direction"];
                                    var creditType = <number>item["creditType"];
                                    var confirmed = <boolean>item["confirmed"];
                                    var entry = TimelineEntry.create(transactionId,timestamp, senderAccountId, recipientAccountId, amount, tips, total, direction, creditType, confirmed);
                                    timelineDay.entries.push(entry);
                                });
                                // sort from youngest to oldest
                                timelineDay.entries = timelineDay.entries.sort((a, b) => { return b.timestamp.getTime() - a.timestamp.getTime() });
                                list.push(timelineDay);
                            });
                            resolve(list);
                        })
                    .catch(reason => {
                        reject("QueryNeuraliumTimelineSection error : " + reason);
                    })
                    .finally(() => {
                        cnx.stop();
                    })
            }).catch(reason => {
                reject("Connection error : " + reason);
            })
        });

    }
    
}