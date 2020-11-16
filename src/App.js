import React, { useState, useMemo, useEffect, useRef } from "react";
import Container from "@material-ui/core/Container";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import MenuItem from "@material-ui/core/MenuItem";
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import Menu from "./components/Menu";
import PairTable from "./components/PairTable";
import useWebSocket from "./hooks/useWebSocket";
import usePairState from "./hooks/usePairsState";

function getPairName(row) {
  return `${row.b}/${row.q}`;
}

function getPriceChange(row) {
  const lastPrice = row.c;
  const openPrice = row.o;
  const change = ((lastPrice - openPrice) / openPrice) * 100;
  return `${change.toFixed(2)}%`;
}

function App() {
  const [state, init, update] = usePairState();
  useEffect(() => {
    let stale = false;

    fetch(
      "https://www.binance.com/exchange-api/v1/public/asset-service/product/get-products"
    )
      .then((res) => res.json())
      .then((result) => result.data.map((d) => ({ ...d, id: d.s })))
      .then((data) => init(data))
      .catch(() => {
        if (!stale) {
          init([]);
        }
      });

    return () => {
      stale = true;
    };
  }, [init]);

  const { message, readyState, close } = useWebSocket(
    "wss://stream.binance.com/stream?streams=!miniTicker@arr"
  );

  const socketState = useMemo(() => {
    if (readyState === 1) {
      return "Sync";
    } else if (readyState === 3) {
      return "Closed";
    } else if (readyState === -1) {
      return "Error";
    }
  }, [readyState]);

  useEffect(() => {
    if (message) {
      const data = JSON.parse(message).data;
      update(data);
    }
  }, [message, update]);

  const allPairs = useMemo(() => {
    const bnbPairs = [...state.bnb].map((id) => state.pairs[id]);
    const btcPairs = [...state.btc].map((id) => state.pairs[id]);
    const altPairs = [...state.alts].map((id) => state.pairs[id]);
    const xrpPairs = [...state.xrp].map((id) => state.pairs[id]);
    const ethPairs = [...state.eth].map((id) => state.pairs[id]);
    const trxPairs = [...state.trx].map((id) => state.pairs[id]);

    return {
      BNB: bnbPairs,
      BTC: btcPairs,
      ALTS: altPairs,
      XRP: xrpPairs,
      ETH: ethPairs,
      TRX: trxPairs,
    };
  }, [state]);

  const [category, setCategory] = useState("BTC");

  const data = useMemo(() => allPairs[category], [allPairs, category]);

  const columns = useMemo(
    () => [
      {
        Header: "Pair",
        accessor: getPairName,
      },
      {
        Header: "Last Price",
        accessor: "c",
      },
      {
        Header: "Change",
        accessor: getPriceChange,
      },
    ],
    []
  );

  const altMenuRef = useRef();

  const [altMenuOpen, setAltMenuOpen] = useState(false);

  return (
    <Container fixed maxWidth="xs" component="section">
      <Box py={1}>
        <Grid container justify="space-between">
          <Grid item xs>
            <Typography variant="h5" component="h1">
              Market
            </Typography>
          </Grid>
          <Grid item xs container justify="flex-end" alignItems="center">
            <Typography variant="body1" color="textSecondary">
              {socketState}
            </Typography>
            <Button
              variant="outlined"
              onClick={close}
              disabled={readyState !== 1}
            >
              Close
            </Button>
          </Grid>
        </Grid>
      </Box>
      <Divider />
      <Box py={1}>
        <Grid container spacing={3}>
          <Grid item xs>
            <Button
              color={category === "BNB" ? "primary" : "default"}
              onClick={() => setCategory("BNB")}
            >
              BNB
            </Button>
          </Grid>
          <Grid item xs>
            <Button
              color={category === "BTC" ? "primary" : "default"}
              onClick={() => setCategory("BTC")}
            >
              BTC
            </Button>
          </Grid>
          <Grid item xs>
            <div
              onMouseOver={() => setAltMenuOpen(true)}
              onMouseOut={() => setAltMenuOpen(false)}
            >
              <Button
                ref={altMenuRef}
                endIcon={<ArrowDropDownIcon />}
                onClick={() => setCategory("ALTS")}
              >
                ALTS
              </Button>
              <Menu anchorRef={altMenuRef} open={altMenuOpen}>
                <MenuItem onClick={() => setCategory("XRP")}>XRP</MenuItem>
                <MenuItem onClick={() => setCategory("ETH")}>ETH</MenuItem>
                <MenuItem onClick={() => setCategory("TRX")}>TRX</MenuItem>
              </Menu>
            </div>
          </Grid>
        </Grid>
      </Box>
      <PairTable data={data} columns={columns} />
    </Container>
  );
}

export default App;
