class Status {
    constructor(
        public currentContract: string | undefined,
        public contractAddress: string | undefined,
        public endpoint: string
    ) {}
}

export const STATE = new Status(
    undefined,
    undefined,
    "http://localhost:8545"
);
