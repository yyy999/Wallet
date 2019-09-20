import { CommonCall } from "./commonCall";
import { LogService } from "../..//service/log.service";
import { HubConnection } from "@aspnet/signalr";
import { TransactionStatuses, TransactionVersion, Transaction, NeuraliumTransaction, NO_TRANSACTION } from "../..//model/transaction";

export class TransactionsCall extends CommonCall {

    private constructor(
        connection: HubConnection,
        logService: LogService) {
        super(connection, logService)
    }

    static create(
        connection: HubConnection,
        logService: LogService) {
        return new TransactionsCall(connection, logService)
    }

    callQueryWalletTransactionHistory(chainType: number, accountUuid: string):Promise<Array<Transaction>> {
        return new Promise<Array<Transaction>>((resolve, reject) => {

            this.logEvent("queryWalletTransactionHistory - call", { 'chainType': chainType, 'accountUuid': accountUuid });
            this.connection.invoke<Array<object>>("QueryWalletTransactionHistory", chainType, accountUuid)
              .then(
                response => {
    
                  var transactions = new Array<Transaction>();
                  response.forEach(transaction => {
                    this.logEvent("queryWalletTransactionHistory - transaction", transaction);
                    try {
                      var id = transaction["TransactionId"];
                      var source = transaction["Sender"];
                      var date = new Date(transaction["Timestamp"]);
                      var status = <TransactionStatuses>transaction["Status"];
                      var version = <TransactionVersion>transaction["Version"];
                      var amount = <number>Number(transaction["Amount"]);
                      var tip = <number>Number(transaction["Tip"]);
                      var local = <boolean>transaction["Local"];
                      var note = transaction["Note"];
                      var recipient = transaction["Recipient"];
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
            this.connection.invoke<object>("QueryWalletTransationHistoryDetails", chainType, accountUuid, transactionId)
              .then(
                response => {
                  this.logEvent("queryWalletTransationHistoryDetails - transaction", response);
                  var transaction : Transaction;// <Transaction>response;
                    try {
                      var id = response["TransactionId"];
                      var source = response["Sender"];
                      var date = new Date(response["Timestamp"]);
                      var details = JSON.parse(response["Contents"]);//{details:"détails to show"};
                      var status = <TransactionStatuses>response["Status"];
                      var version = <TransactionVersion>response["Version"];
                      var amount = <number>Number(response["Amount"]);
                      var tip = <number>Number(response["Tip"]);
                      var local = <boolean>response["Local"];
                      var note = response["Note"];
                      var recipient = response["Recipient"];
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