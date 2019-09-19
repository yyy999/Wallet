import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AccountsService {

  constructor() { }

  // make sure that the acccount Id is surrounded by {} if it is not already
  public FormatAccountId(accountId:string):string{

      return  '{' + accountId.trim().replace(/[\{]+/, '').replace(/[\}]+/, '') + '}';
  }
}
