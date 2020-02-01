import { CommonCall } from './commonCall';
import { LogService } from '../..//service/log.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { TransactionStatuses, TransactionVersion, Transaction, NeuraliumTransaction, NO_TRANSACTION } from '../..//model/transaction';
import * as moment from 'moment';

export class TransactionsCall extends CommonCall {

    private constructor(
      protected serviceConnectionService: ServerConnectionService,
        logService: LogService) {
        super(serviceConnectionService, logService);
    }

    static create(
      serviceConnectionService: ServerConnectionService,
        logService: LogService) {
        return new TransactionsCall(serviceConnectionService, logService);
    }

    callQueryWalletTransactionHistory(chainType: number, accountUuid: string): Promise<Array<Transaction>> {
        return new Promise<Array<Transaction>>((resolve, reject) => {

            this.logEvent('queryWalletTransactionHistory - call', { 'chainType': chainType, 'accountUuid': accountUuid });
            this.serviceConnectionService.invoke<Array<object>>('QueryWalletTransactionHistory', chainType, accountUuid)
              .then(
                response => {

                  const transactions = new Array<Transaction>();
                  response.forEach(transaction => {
                    this.logEvent('queryWalletTransactionHistory - transaction', transaction);
                    try {
                      const id = transaction['transactionId'];
                      const source = transaction['sender'];

                      const date =  moment(transaction['timestamp']).toDate();
                      const status = <TransactionStatuses>transaction['status'];
                      const version = <TransactionVersion>transaction['version'];
                      const amount = <number>Number(transaction['amount']);
                      const tip = <number>Number(transaction['tip']);
                      const local = <boolean>transaction['local'];
                      const note = transaction['note'];
                      const recipient = transaction['recipient'];
                      const newTransaction = new NeuraliumTransaction(id, source, date, version, null, status, local, note, recipient, amount, tip);
                      transactions.push(newTransaction);
                    } catch (error) {
                      this.logEvent('Transaction conversion error', transaction);
                    }
                  });
                  resolve(transactions);
                })
              .catch(reason => {
                reject('QueryWalletTransactionHistory error : ' + reason);
              });
          });
      }

      callQueryTransationHistoryDetails(chainType: number, accountUuid: string, transactionId: string): Promise<Transaction> {
        return new Promise<Transaction>((resolve, reject) => {

            this.logEvent('QueryTransationHistoryDetails - call', { 'chainType': chainType, 'accountUuid': accountUuid, 'transactionId' : transactionId });
            this.serviceConnectionService.invoke<object>('QueryWalletTransationHistoryDetails', chainType, accountUuid, transactionId)
              .then(
                response => {
                  this.logEvent('queryWalletTransationHistoryDetails - transaction', response);
                  let transaction: Transaction; // <Transaction>response;
                    try {
                      const id = response['transactionId'];
                      const source = response['sender'];
                      const date =  moment(response['timestamp']).toDate();
                      const details = JSON.parse(response['contents']); // {details:"détails to show"};
                      const status = <TransactionStatuses>response['status'];
                      const version = <TransactionVersion>response['version'];
                      const amount = <number>Number(response['amount']);
                      const tip = <number>Number(response['tip']);
                      const local = <boolean>response['local'];
                      const note = response['note'];
                      const recipient = response['recipient'];
                      transaction = new NeuraliumTransaction(id, source, date, version, details, status, local, note, recipient, amount, tip);
                    } catch (error) {
                      this.logEvent('Transaction conversion error', transaction);
                    }
                  resolve(transaction);
                })
              .catch(reason => {
                reject('QueryTransationHistoryDetails error : ' + reason);
              });
          });
      }
}
