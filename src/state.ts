class Status {
    constructor(
        public currentContract: string | undefined,
        public contractAddress: string | undefined
    ) {}
}

export const STATE = new Status(undefined, undefined);
