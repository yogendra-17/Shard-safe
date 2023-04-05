import { Buffer } from 'buffer';
import BN from 'bn.js';
import { randomBytes } from 'react-native-randombytes';

function multiplyGF2(field1: BN, field2: BN): BN {
if (field2.gt(field1)) {
[field1, field2] = [field2, field1];
}
let result = new BN.BN(0, 10);
while (!field2.isZero()) {
if (!field2.and(new BN.BN(1, 10)).isZero()) {
result = result.xor(field1);
}
field1 = field1.shln(1);
field2 = field2.shrn(1);
}
return result;
}

function divideGF2(a: BN, b: BN): { quotient: BN; remainder: BN } {
if (a.lt(b)) {
return { quotient: new BN.BN(0, 10), remainder: a };
}

let quotient = new BN.BN(0, 10);
let remainder = a;
let degreeB = b.bitLength();
let s;
while (remainder.bitLength() >= degreeB) {
s = new BN.BN(1, 10).shln(remainder.bitLength() - degreeB);
quotient = quotient.xor(s);
remainder = remainder.xor(multiplyGF2(b, s));
}
return { quotient, remainder };
}

class Element {
  private _mul(x_m: Element): Element {
    throw new Error('Method not implemented.');
  }
  private _encode() {
    throw new Error('Method not implemented.');
  }
irrPoly: BN;
value: BN;

constructor(encodedValue: Buffer | BN) {
this.irrPoly = new BN.BN(1, 10)
.add(new BN.BN(2, 10).pow(new BN.BN(121, 10)))
.add(new BN.BN(2, 10).pow(new BN.BN(178, 10)))
.add(new BN.BN(2, 10).pow(new BN.BN(241, 10)))
.add(new BN.BN(2, 10).pow(new BN.BN(256, 10)));
if (encodedValue instanceof Buffer) {
this.value = new BN(encodedValue.toString('hex'), 16);
} else {
this.value = encodedValue;
}
}

asNumber(): BN {
return this.value;
}

equals(other: Element): boolean {
return this.value.eq(other.asNumber());
}

toBuffer(): Buffer {
if (this.value.toString(16).length % 2) {
return Buffer.from('0' + this.value.toString(16), 'hex');
}
return Buffer.from(this.value.toString(16), 'hex');
}

multiply(factor: Element): Element {
let field1 = this.value;
let field2 = factor.value;
if (field2.gt(field1)) {
[field1, field2] = [field2, field1];
}
if (this.irrPoly === field1 || this.irrPoly === field2) {
return new Element(new BN.BN(0, 10));
}
let mask1 = new BN.BN(2, 10).pow(new BN.BN(256, 10));
let z = new BN.BN(0, 10);
let mask2, mask3;
while (!field2.isZero()) {
mask2 = new BN.BN(field2.and(new BN.BN(1, 10)).toString(2).repeat(256), 2);
z = mask2.and 
  f2 = f2.shrn(1);
    }
    return new Element(z);
  }

  _add(term: Element): Element {
    return new Element(this.val.xor(term.val));
  }

  inverse(): Element {
    if (this.val.isZero()) {
      throw 'Inversion of zero is not defined!';
    }

    let r0: BN, r1: BN, s0: BN, s1: BN, q: BN, temp1: BN, temp2: BN;

    r0 = this.val;
    r1 = this.irr_poly;
    s0 = new BN.BN(1, 10);
    s1 = new BN.BN(0, 10);
    while (r1.gt(new BN.BN(0, 10))) {
      q = div_gf2(r0, r1).q;

      temp1 = r1;
      r1 = r0.xor(mul_gf2(q, r1));
      r0 = temp1;

      temp2 = s1;
      s1 = s0.xor(mul_gf2(q, s1));
      s0 = temp2;
    }
    return new Element(s0);
  }

  _pow(exp: number): Element {
    let res = new Element(this.val);
    for (let _ = 0; _ < exp - 1; _++) {
      res = res._mul(this);
    }
    return res;
  }
}

const make_share = (user: BN, coeffs: Element[]) => {
  let idx: Element = new Element(user);
  let share: Element = new Element(new BN.BN(0, 10));
  for (let i = 0; i < coeffs.length; i++) {
    share = idx._mul(share)._add(coeffs[i]);
  }
  return share._encode();
};

const splitSSS = async (n: number, k: number, sec: string) => {
  let coeff: Element[] = [],
    secret: Buffer;
  secret = Buffer.from(sec, 'hex');

  for (let i = 0; i < k - 1; i++) {
    const rnb = await randomBytes(32);
    coeff.push(new Element(rnb));
  }

  coeff.push(new Element(secret));
  let res: {x: BN; y: string}[] = [];
  for (let i = 1; i < n + 1; i++) {
    let share: string = make_share(new BN.BN(i, 10), coeff).toString('hex');
    res.push({x: new BN.BN(i, 10), y: share});
  }
  return res;
};

const joinSSS = (shares: {x: string; y: string}[]): string => {
  let k: number = shares.length,
    gf_shares: Element[][] = [],
    idx: Element,
    val: Element,
    result: Element;

  for (let i = 0; i < shares.length; i++) {
    let z = new BN.BN(shares[i].x, 16);
    idx = new Element(z);
    val = new Element(Buffer.from(shares[i].y, 'hex'));
    gf_shares.push([idx, val]);
  }

  result = new Element(new BN.BN(0, 10));
  let x_j: Element, y_j: Element, num: Element, den: Element;
  for (let j = 0; j < k; j++) {
    [x_j, y_j] = [gf_shares[j][0], gf_shares[j][1]];
    num = new Element(new BN.BN(1, 10));
    den = new Element(new BN.BN(1, 10));
    for (let m = 0; m < k; m++) {
      let x_m: Element = gf_shares[m][0];
      if (m != j) {
        num = num._mul(x_m);
        den = den._mul(x_j._add(x_m));
      }
    }
    result = result._add(y_j._mul(num)._mul(den.inverse()));
  }
  return result._encode().toString('hex');
};

export const split = async(n: number, k: number, sec: string) => {
  let res22 = await splitSSS(2, 2, sec);
  let resnk = {"dealer_share": res22[0], "parties_share": await splitSSS(n, k, res22[1].y)};
  return resnk;
}

export const join = (ownerShare: {x:string, y:string}[], share: {x: string, y: string}[]) => {
  var res22 = joinSSS(share);
  var otherHalf = {x: '02', y: res22};
  ownerShare.push(otherHalf);
  return joinSSS(ownerShare);
}

