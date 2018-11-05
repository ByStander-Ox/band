const { expectThrow } = require('openzeppelin-solidity/test/helpers/expectThrow');
const { increaseTimeTo } = require('openzeppelin-solidity/test/helpers/increaseTime');

const BandToken = artifacts.require('BandToken');
const BondingCurve = artifacts.require('BondingCurve');
const CommunityToken = artifacts.require('CommunityToken');
const Parameters = artifacts.require('Parameters');
const Voting = artifacts.require('Voting');
const BigNumber = web3.BigNumber;


require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('BondingCurve', ([_, owner, alice, bob, carol]) => {
  beforeEach(async () => {
    this.band = await BandToken.new(1000000, { from: owner });
    this.comm = await CommunityToken.new(
      'CoinHatcher', 'XCH', 18, { from: owner });
    this.voting = await Voting.new(this.comm.address, { from: owner });
    this.params = await Parameters.new(this.voting.address,
      [
        "params:proposal_expiration_time",
        "params:proposal_pass_percentage",
      ],
      [
        86400,
        80,
      ],
      { from: owner });

    // X ^ 2 curve
    this.curve = await BondingCurve.new(
      this.band.address, this.comm.address, this.params.address,
      [8, 1, 0, 2], { from: owner });
    await this.comm.transferOwnership(this.curve.address, { from: owner });
  });

  it('should auto-inflate properly', async () => {
    await this.band.transfer(bob, 100000, { from: owner });
    await this.band.approve(this.curve.address, 50000, { from: bob });

    await increaseTimeTo(1546300800);
    await this.curve.buy(100, 20000, { from: bob });

    (await this.band.balanceOf(bob)).should.bignumber.eq(new BigNumber(90000));
    (await this.comm.balanceOf(bob)).should.bignumber.eq(new BigNumber(100));
    (await this.curve.curveMultiplier()).should.bignumber.eq(new BigNumber(1000000000000));

    // Inflate 10% per month
    await this.comm.approve(this.voting.address, 100, { from: bob });
    await this.voting.updateVotingPower(
        80, 0, ['0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffff'], { from: bob });
    await this.params.propose("bonding:inflation_ratio", 38581, { from: bob });
    await this.params.vote(
        1, 80, ['0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffff'], { from: bob });

    // One month has passed
    await increaseTimeTo(1548892800);
    await this.curve.buy(10, 20000, { from: bob });

    (await this.band.balanceOf(bob)).should.bignumber.eq(new BigNumber(88100));
    (await this.comm.balanceOf(bob)).should.bignumber.eq(new BigNumber(30));
    (await this.comm.balanceOf(owner)).should.bignumber.eq(new BigNumber(10));
    (await this.curve.curveMultiplier()).should.bignumber.eq(new BigNumber(826446280991));
  });

  it('should allow anyone to buy and sell community tokens', async () => {
    await expectThrow(this.curve.buy(100,  9000, { from: bob }));
    await expectThrow(this.curve.buy(100, 11000, { from: bob }));

    await this.band.transfer(bob, 100000, { from: owner });
    await expectThrow(this.curve.buy(100,  9000, { from: bob }));
    await expectThrow(this.curve.buy(100, 11000, { from: bob }));

    await this.band.approve(this.curve.address, 100000, { from: bob });
    await expectThrow(this.curve.buy(100,  9000, { from: bob }));
    await this.curve.buy(100, 11000, { from: bob });

    (await this.band.balanceOf(bob)).should.bignumber.eq(new BigNumber(90000));
    (await this.comm.balanceOf(bob)).should.bignumber.eq(new BigNumber(100));
    (await this.curve.curveMultiplier()).should.bignumber.eq(new BigNumber(1000000000000));

    await this.curve.buy(1, 10000, { from: bob });

    (await this.band.balanceOf(bob)).should.bignumber.eq(new BigNumber(89799));
    (await this.comm.balanceOf(bob)).should.bignumber.eq(new BigNumber(101));
    (await this.curve.curveMultiplier()).should.bignumber.eq(new BigNumber(1000000000000));

    await expectThrow(this.curve.sell(10, 1900, { from: carol }));
    await expectThrow(this.curve.sell(10, 2000, { from: bob }));
    await this.curve.sell(10, 1900, { from: bob });

    (await this.band.balanceOf(bob)).should.bignumber.eq(new BigNumber(91719));
    (await this.comm.balanceOf(bob)).should.bignumber.eq(new BigNumber(91));
  });

  it('should allow only owner to inflate and deflate the system', async () => {
    this.band.approve(this.curve.address, 100000, { from: owner });
    await this.curve.buy(100, 10000, { from: owner });

    (await this.band.balanceOf(owner)).should.bignumber.eq(new BigNumber(990000));
    (await this.comm.balanceOf(owner)).should.bignumber.eq(new BigNumber(100));
    (await this.comm.balanceOf(bob)).should.bignumber.eq(new BigNumber(0));

    await expectThrow(this.curve.inflate(10, bob, { from: bob }));
    await this.curve.inflate(10, bob, { from: owner });

    (await this.band.balanceOf(owner)).should.bignumber.eq(new BigNumber(990000));
    (await this.comm.balanceOf(owner)).should.bignumber.eq(new BigNumber(100));
    (await this.comm.balanceOf(bob)).should.bignumber.eq(new BigNumber(10));
    (await this.curve.curveMultiplier()).should.bignumber.eq(new BigNumber(826446280991));

    await expectThrow(this.curve.deflate(1, bob, { from: bob }));
    await expectThrow(this.curve.deflate(100, bob, { from: owner }));
    await this.curve.deflate(5, bob, { from: owner });

    (await this.band.balanceOf(owner)).should.bignumber.eq(new BigNumber(990000));
    (await this.comm.balanceOf(owner)).should.bignumber.eq(new BigNumber(100));
    (await this.comm.balanceOf(bob)).should.bignumber.eq(new BigNumber(5));
    (await this.curve.curveMultiplier()).should.bignumber.eq(new BigNumber(907029478458));

    await this.curve.sell(50, 0, { from: owner });
    (await this.band.balanceOf(owner)).should.bignumber.eq(new BigNumber(997256));
    (await this.comm.balanceOf(owner)).should.bignumber.eq(new BigNumber(50));
  });
});
