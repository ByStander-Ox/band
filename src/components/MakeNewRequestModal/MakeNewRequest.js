import React from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'ui/common'
import { connect } from 'react-redux'
import { hideModal } from 'actions'
import { parametersToHex } from 'utils/helper'
import { web3Selector } from 'selectors/current'
import axios from 'axios'
import Step1 from './Step1'
import Step2 from './Step2'
import { Buffer } from 'buffer'
import delay from 'delay'

const Container = styled(Flex).attrs({
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
})`
  padding: 30px 25px 15px;
  width: 640px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 5px 20px 0 rgba(0, 0, 0, 0.45);
`

const InnerContainer = styled.div`
  width: 430px;
`

window.buffer = Buffer

class MakeNewRequest extends React.Component {
  state = {
    pageState: 1,
    isLoading: [true, true, true],
    params: ['', '', ''],
    result: null,
    txHash: null,
    error: null,
  }

  setStep = step => {
    return new Promise(r =>
      this.setState(
        {
          isLoading: Object.assign([...this.state.isLoading], {
            [step]: false,
          }),
        },
        r,
      ),
    )
  }

  changePage = pageState => this.setState({ pageState })

  handleChange = e => {
    const { name, value } = e.target
    this.setState({
      [name]: value,
    })
  }

  handleProcess = async () => {
    // Serialize the params and compose query key
    const { params } = this.state
    const { meta, request, response } = this.props.request
    const json = JSON.stringify({ meta, request, response })
    const queryJson = JSON.parse(
      json
        .replace('{0}', params[0])
        .replace('{1}', params[1])
        .replace('{2}', params[2]),
    )
    await this.setStep(0)

    try {
      // Relay the request to providers
      const {
        data: { value: step2Value },
      } = await axios.post(
        'https://band-kovan.herokuapp.com/data/web_request_test',
        queryJson,
      )
      await this.setStep(1)
      this.setState({
        result: step2Value,
      })

      // Commit result to chain
      const ipfsHex = this.props.request.keyOnChain.slice(0, 70)
      const types = meta.variables
      const paramsHex = parametersToHex(params.slice(0, types.length), types)

      const {
        data: { result: txHash },
      } = await axios.post('https://band-kovan.herokuapp.com/data/request', {
        tcd: this.props.tcdAddress,
        key: `${ipfsHex}${paramsHex}`,
        broadcast: true,
      })

      // waiting for txHash confirm
      while (true) {
        const trx = await this.props.web3.eth.getTransaction(txHash)
        if (trx && trx.blockNumber) break
        await delay(50)
      }
      this.setState({
        txHash,
      })
      await this.setStep(2)
    } catch (e) {
      console.error(e.message)
      this.setState({
        error: e.message,
      })
    }
  }

  render() {
    const { pageState, params, isLoading, result, txHash } = this.state
    const { ipfsPath, request } = this.props.request

    return (
      <Container>
        <Flex flexDirection="column" alignItems="center" width="100%">
          <Text
            fontFamily="head"
            fontSize="20px"
            my="10px"
            fontWeight="bold"
            color="#4a4a4a"
          >
            Make a New Request
          </Text>
          <Text m={2} fontSize="14px" fontWeight="400" color="#4a4a4a">
            Query new web request to an existing endpoint with custome
            parameters.
          </Text>

          <InnerContainer>
            {pageState === 1 ? (
              <Step1
                onNext={() => {
                  this.handleProcess()
                  this.changePage(2)
                }}
                ipfsPath={ipfsPath}
                request={request}
                params={params}
                onSetParams={params =>
                  this.setState({
                    params,
                  })
                }
              />
            ) : (
              <Step2
                onNext={() => this.props.hideModal()}
                isLoading={isLoading}
                result={result}
                txHash={txHash}
              />
            )}
          </InnerContainer>
        </Flex>
      </Container>
    )
  }
}

const mapStateToProps = state => ({
  web3: web3Selector(state),
})

const mapDispatchToProps = dispatch => ({
  hideModal: () => dispatch(hideModal()),
})

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MakeNewRequest)
