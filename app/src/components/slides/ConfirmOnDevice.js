import React from 'react';
import Slide from './Slide';
import styles from './ConfirmOnDevice.css';
import slideWrapper from './SlideWrapper.css'
import {toPromise} from '../../utils';
import getICOContract from '../../ICO';
import web3 from '../../initWeb3';
import LinearProgress from 'material-ui/LinearProgress';
import {Link, hashHistory} from 'react-router';

class ConfirmOnDevice extends React.Component {
    constructor() {
        super();
        this.state = {txHash: null, confirmations: 0};
        this.latestFilter = web3.eth.filter('latest');
        this.sendDonation();
    }

    componentWillUnmount() {
        this.latestFilter.stopWatching(()=> {
        });
    }

    async sendDonation() {
        let ICO = await getICOContract();
        if (web3.eth.defaultAccount) {
            let accounts = web3.eth.defaultAccount
        } else {
            hashHistory.push("/connect_ledger");
        }
        let tokens = await ICO.balanceOf(web3.eth.defaultAccount, {from: web3.eth.defaultAccount});
        console.log(`You have ${tokens.valueOf()} tokens`);
        let txHash = await toPromise(web3.eth.sendTransaction, {
            value: web3.toWei(0.01, "ether"),
            from: web3.eth.defaultAccount,
            to: ICO.address,
            gas: 89000
        });
        console.log(`https://testnet.etherscan.io/tx/${txHash}`);
        this.watchTransaction(txHash);
    }

    async onConfirmed(receipt) {
        let confirmations = this.state.confirmations + 1;
        if (confirmations < 2) {
            this.setState({confirmations});
        } else {
            hashHistory.push("/success");
        }
    }

    async onNewBlock(error, result) {
        if (error) {
            console.log(error);
        } else {
            console.log(`New block ${result}`);
            let receipt = await toPromise(web3.eth.getTransactionReceipt, this.state.txHash);
            if (receipt) {
                this.onConfirmed.bind(this)(receipt)
            } else {
                console.log("Wait for it...!");
            }
        }
    }

    watchTransaction(txHash) {
        this.setState({txHash}, ()=> {
            this.latestFilter.watch(this.onNewBlock.bind(this))
        });
    }

    renderTransactionState() {
        if (!this.state.txHash) {
            return (
                <div>
                    <h2>Please confirm on device</h2>
                    <LinearProgress mode="indeterminate"/>
                </div>
            );
        } else {
            let txLink = "https://testnet.etherscan.io/tx/" + this.state.txHash;
            let loader;
            if (this.state.confirmations) {
                loader = <LinearProgress mode="determinate" value={this.state.confirmations} max={2}>
                </LinearProgress>;
            } else {
                loader = <LinearProgress mode="indeterminate"/>
            }
            return (
                <div>
                    <h2>
                        <a href={txLink} target="_blank">Transaction</a> is being confirmed
                    </h2>
                    {loader}
                </div>
            )
        }
    }

    render() {
        let transactionState = this.renderTransactionState();
        return (
            <Slide>
                <div className={slideWrapper.wrapper}>
                    <h1>Confirm on device</h1>
                    <div className={styles.confirm}>
                        <div className={styles.txState}>{transactionState}</div>
                    </div>
                    <div className={styles.details}></div>
                </div>
            </Slide>
        );
    }
}

export default ConfirmOnDevice;