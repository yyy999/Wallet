export class TotalNeuralium {
    total: number = 0;
    debit: number = 0;
    credit: number = 0;
    frozen:number = 0;

    get usable(): number {
        return this.total - (this.debit + this.frozen);
    }

    static create(total: number = 0, credit: number = 0, debit: number = 0, frozen:number = 0): TotalNeuralium {
        var totalNeuralium = new TotalNeuralium();
        totalNeuralium.total = total;
        totalNeuralium.credit = credit;
        totalNeuralium.debit = debit;
        return totalNeuralium;
    }
}

export const NO_NEURALIUM_TOTAL = <TotalNeuralium>{
    total: 500,
    credit: 10,
    debit: 20,
    frozen: 10
}