const express = require("express")
const cors = require("cors")
const Warp = require("warp-contracts")


const app = express()
const port = process.env.PORT || 3000
const warp = Warp.WarpFactory.forMainnet()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.get("/get-details/:contractId", async (req, res)=>{
    try{
        let contractId = req.params.contractId
        let arweaveContractState = await warp.contract(contractId).readState()
        if(!arweaveContractState.cachedValue.state) return res.status(400).json({message: `state not found for arweave contract: ${contractId}`})

        return res.status(200).json({message: "state fetched successfully", data: arweaveContractState.cachedValue.state})
    }catch(err){
        console.log("error for data called", err)
        return res.status(500).json({message: "an error occured"})
    }
})

app.post("/confirm-payment", async (req, res)=>{
        try{
            let jwk = await warp.arweave.wallets.generate()
            let {txHash, contractId} = req.body
            const tags = [
                { name: "Input", value: {txHash, function: "topup"}.toString() },
                { name: "Contract-Label", value: "M3ters" },
                { name: "Contract-Use", value: "M3tering Protocol" },
                { name: "Content-Type", value: "application/json" },
              ]
            console.log("body", req.body)

            let arweaveContract = warp.contract(contractId).connect(jwk)

            let dryWriteResult = await arweaveContract.dryWrite({
                function: "topup",
                txHash
            }, undefined, tags)

            console.log("drywrite result", dryWriteResult)

            if(dryWriteResult.type == "error"){
                return res.status(400).json({message: dryWriteResult.errorMessage})
            }

            let result = await arweaveContract.writeInteraction({
                function: "topup",
                txHash
            })

            console.log("writeInteraction result ", result)

            return res.status(200).json({message: "successful"})
        }catch(err){
            console.log("error from post", err)
            return res.status(500).json({message: err.message})
        }
})

app.listen(port, ()=>{
    console.log("server started on port"+ " " + port)
})