class Status {
    constructor(
        public currentContract: string | null
    ) {}
}

export const STATE = new Status(null);
