import { useEffect, useState } from "react";
import { MainContract } from "../contracts/MainContract";
import { useTonClient } from "./useTonClient";
import { useAsyncInitialize } from "./useAsyncInitialize";
import { Address, OpenedContract } from "@ton/core";
import { toNano } from "@ton/core";
import { useTonConnect } from "./useTonConnect";


export function useMainContract() {
    const client = useTonClient();
    const { sender } = useTonConnect();


    const [balance, setBalance] = useState<null | number>(0);
    const [contractData, setContractData] = useState<null | {
        counter_value: number;
        recent_sender: Address;
        owner_address: Address;
    }>();

    const mainContract = useAsyncInitialize(async () => {
        if (!client) return null;
        const contract = new MainContract(
            Address.parse("EQCS7PUYXVFI-4uvP1_vZsMVqLDmzwuimhEPtsyQKIcdeNPu")
        );
        //@ts-ignore
        return client.open(contract) as OpenedContract<MainContract>;
    }, [client]);

    const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time));
    
    useEffect(() => {
        async function getValue() {
            if (!mainContract) return;
            setContractData(null);
            // @ts-ignore
            const val = await mainContract.getData();
            //@ts-ignore
            const { number } = await mainContract.getBalance();
            setContractData({
                counter_value: val.number,
                recent_sender: val.recent_sender,
                owner_address: val.owner_address,
            });
            setBalance(number)
            await sleep(5000); // sleep 5 seconds and poll value again
            getValue();
        }
        getValue();
    }, [mainContract]);

    return {
        contract_balance: balance,
        contract_address: mainContract?.address.toString(),
        ...contractData,
        sendIncrement: async() => {
            // @ts-ignore
            return mainContract?.sendIncrement(sender, toNano("0.05"), 5);
        }
    };
}