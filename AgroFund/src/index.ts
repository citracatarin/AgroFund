import { v4 as uuidv4 } from "uuid";
import { StableBTreeMap } from "azle";
import express from "express";
import { time } from "azle";

/**
 * Messages storage for the AgroFund platform.
 * The storage uses a StableBTreeMap to ensure that the data survives canister upgrades.
 */
class FundRequest {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  raisedAmount: number;
  createdAt: Date;
  updatedAt: Date | null;
}

const fundRequestsStorage = StableBTreeMap<string, FundRequest>(0);

const app = express();
app.use(express.json());

app.post("/fund-requests", (req, res) => {
  const fundRequest: FundRequest = {
    id: uuidv4(),
    createdAt: getCurrentDate(),
    raisedAmount: 0,
    ...req.body,
  };
  fundRequestsStorage.insert(fundRequest.id, fundRequest);
  res.json(fundRequest);
});

app.get("/fund-requests", (req, res) => {
  res.json(fundRequestsStorage.values());
});

app.get("/fund-requests/:id", (req, res) => {
  const fundRequestId = req.params.id;
  const fundRequestOpt = fundRequestsStorage.get(fundRequestId);
  if (!fundRequestOpt) {
    res.status(404).send(`The fund request with id=${fundRequestId} not found`);
  } else {
    res.json(fundRequestOpt);
  }
});

app.put("/fund-requests/:id", (req, res) => {
  const fundRequestId = req.params.id;
  const fundRequestOpt = fundRequestsStorage.get(fundRequestId);
  if (!fundRequestOpt) {
    res.status(400).send(`Couldn't update the fund request with id=${fundRequestId}. Fund request not found`);
  } else {
    const fundRequest = fundRequestOpt;
    const updatedFundRequest = {
      ...fundRequest,
      ...req.body,
      updatedAt: getCurrentDate(),
    };
    fundRequestsStorage.insert(fundRequest.id, updatedFundRequest);
    res.json(updatedFundRequest);
  }
});

app.delete("/fund-requests/:id", (req, res) => {
  const fundRequestId = req.params.id;
  const deletedFundRequest = fundRequestsStorage.remove(fundRequestId);
  if (!deletedFundRequest) {
    res.status(400).send(`Couldn't delete the fund request with id=${fundRequestId}. Fund request not found`);
  } else {
    res.json(deletedFundRequest);
  }
});

app.listen();

function getCurrentDate() {
  const timestamp = new Number(time());
  return new Date(timestamp.valueOf() / 1000_000);
}
