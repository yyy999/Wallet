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
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("queryWalletTransactionHistory - call", { 'chainType': chainType, 'accountUuid': accountUuid });
            cnx.invoke<Array<object>>("queryWalletTransactionHistory", chainType, accountUuid)
              .then(
                response => {
    
                  var transactions = new Array<Transaction>();
                  response.forEach(transaction => {
                    this.logEvent("queryWalletTransactionHistory - transaction", transaction);
                    try {
                      var id = transaction["transactionId"];
                      var source = transaction["sender"];
                      var date = new Date(transaction["timestamp"]);
                      var status = <TransactionStatuses>transaction["status"];
                      var version = <TransactionVersion>transaction["version"];
                      var amount = <number>transaction["amount"];
                      var tip = <number>transaction["tip"];
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
              })
              .finally(() => {
                cnx.stop();
              })
          }).catch(reason => {
            reject("Connection error : " + reason);
          })
        });
      }

      callQueryTransationHistoryDetails(chainType: number, accountUuid: string, transactionId:string):Promise<Transaction> {
        return new Promise<Transaction>((resolve, reject) => {
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("QueryTransationHistoryDetails - call", { 'chainType': chainType, 'accountUuid': accountUuid, 'transactionId' : transactionId });
            cnx.invoke<object>("queryWalletTransationHistoryDetails", chainType, accountUuid, transactionId)
              .then(
                response => {
                  this.logEvent("queryWalletTransationHistoryDetails - transaction", response);
                  var transaction : Transaction;// <Transaction>response;
                    try {
                      var id = response["transactionId"];
                      var source = response["sender"];
                      var date = new Date(response["timestamp"]);
                      var details = JSON.parse(response["contents"]);//{details:"détails to show"};
                      var status = <TransactionStatuses>response["status"];
                      var version = <TransactionVersion>response["version"];
                      var amount = <number>response["amount"];
                      var tip = <number>response["tip"];
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