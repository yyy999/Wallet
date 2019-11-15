import { CommonCall } from "./commonCall";
import { LogService } from "../..//service/log.service";
import { ServerConnectionService } from '../..//service/server-connection.service';
import { TransactionStatuses, TransactionVersion, Transaction, NeuraliumTransaction, NO_TRANSACTION } from "../..//model/transaction";
import * as moment from 'moment';

export class TransactionsCall extends CommonCall {

    private constructor(
      protected serviceConnectionService : ServerConnectionService,
        logService: LogService) {
        super(serviceConnectionService, logService)
    }

    static create(
      serviceConnectionService : ServerConnectionService,
        logService: LogService) {
        return new TransactionsCall(serviceConnectionService, logService)
    }

    callQueryWalletTransactionHistory(chainType: number, accountUuid: string):Promise<Array<Transaction>> {
        return new Promise<Array<Transaction>>((resolve, reject) => {

            this.logEvent("queryWalletTransactionHistory - call", { 'chainType': chainType, 'accountUuid': accountUuid });
            this.serviceConnectionService.invoke<Array<object>>("QueryWalletTransactionHistory", chainType, accountUuid)
              .then(
                response => {
    
                  var transactions = new Array<Transaction>();
                  response.forEach(transaction => {
                    this.logEvent("queryWalletTransactionHistory - transaction", transaction);
                    try {
                      var id = transaction["transactionId"];
                      var source = transaction["sender"];
                     
                      var date =  moment(transaction["timestamp"]).toDate();
                      var status = <TransactionStatuses>transaction["status"];
                      var version = <TransactionVersion>transaction["version"];
                      var amount = <number>Number(transaction["amount"]);
                      var tip = <number>Number(transaction["tip"]);
                      var local = <boolean>transaction["local"];
                      var note = transaction["note"];
                      var recipient = transaction["recipient"];
                      var newTransaction = new NeuraliumTransaction(id, source, date, version, null, status, local, note, recipient, amount,tip);
                      transactions.push(newTransaction);
                    }
                    catch (error) {
                      this.logEvent("Transaction conversion error", transaction);
                    }
                  })
                  resolve(transactions);
                })
              .catch(reason => {
                reject("QueryWalletTransactionHistory error : " + reason);
              });
          });
      }

      callQueryTransationHistoryDetails(chainType: number, accountUuid: string, transactionId:string):Promise<Transaction> {
        return new Promise<Transaction>((resolve, reject) => {

            this.logEvent("QueryTransationHistoryDetails - call", { 'chainType': chainType, 'accountUuid': accountUuid, 'transactionId' : transactionId });
            this.serviceConnectionService.invoke<object>("QueryWalletTransationHistoryDetails", chainType, accountUuid, transactionId)
              .then(
                response => {
                  this.logEvent("queryWalletTransationHistoryDetails - transaction", response);
                  var transaction : Transaction;// <Transaction>response;
                    try {
                      var id = response["transactionId"];
                      var source = response["sender"];
                      var date =  moment(response["timestamp"]).toDate();
                      var details = JSON.parse(response["contents"]);//{details:"détails to show"};
                      var status = <TransactionStatuses>response["status"];
                      var version = <TransactionVersion>response["version"];
                      var amount = <number>Number(response["amount"]);
                      var tip = <number>Number(response["tip"]);
                      var local = <boolean>response["local"];
                      var note = response["note"];
                      var recipient = response["recipient"];
                      transaction = new NeuraliumTransaction(id, source, date, version, details, status, local, note, recipient, amount,tip);
                    }
                    catch (error) {
                      this.logEvent("Transaction conversion error", transaction);
                    }
                  resolve(transaction);
                })
              .catch(reason => {
                reject("QueryTransationHistoryDetails error : " + reason);
              });
          });
      }
}