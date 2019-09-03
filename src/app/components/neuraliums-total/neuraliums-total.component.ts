import { Component, OnInit } from '@angular/core';
import { NeuraliumService } from '../..//service/neuralium.service';
import { TotalNeuralium, NO_NEURALIUM_TOTAL } from '../..//model/total-neuralium';

@Component({
  selector: 'app-neuraliums-total',
  templateUrl: './neuraliums-total.component.html',
  styleUrls: ['./neuraliums-total.component.scss']
})
export class NeuraliumsTotalComponent implements OnInit {
  showNeuraliums: boolean = false;
  neuraliumTotal: TotalNeuralium = NO_NEURALIUM_TOTAL;

  constructor(
    private neuraliumService:NeuraliumService) { }

  ngOnInit() {
    this.neuraliumService.getShowNeuraliumTotal().subscribe(show =>{
      this.showNeuraliums = show;
    });

    this.neuraliumService.getNeuraliumTotal().subscribe(total =>{
      this.neuraliumTotal = total;
    })
  }

  get hasCredit():boolean{
    return this.neuraliumTotal.credit > 0;
  }

  get hasDebit():boolean{
    return this.neuraliumTotal.debit > 0;
  }

  get showFrozen():boolean{
    return this.neuraliumTotal.frozen > 0;
  }
}
