import React,{Component} from 'react';

import './App.css';
import { Segment,Header, Form, Container, Button, Dropdown } from 'semantic-ui-react' ;

class App extends Component {
  constructor(props) {
        super(props);
        this.state = { token : [
      { key: 'Dai', value: 'dai', text: 'Dai' },
      { key: 'BTC', value: 'btc', text: 'Bitcoin' },
    ],
    obj:[{addr:'',amt:'',tkn:''}],
  }

    }

    appendInput() {
      let temp = [...this.state.obj, {addr:'',amt:'',tkn:''}]
       this.setState({obj:temp});
   }

  HeaderExampleFloating(){
  return (
     <Segment>
     <Header as ='h2' color = 'blue' textAlign = 'center'>
     DevFolio ETHIndia
     </Header>
     </Segment>
  );
}

onSubmit =  () =>{
let address=[];
let amount=[];
let token=[];
this.state.obj.map((input,index) => {
  let address1 = [];
  let amount1 = [];
  let token1 = [];

 address1 = [...address, input.addr];
 amount1 = [...amount, input.amt];
 token1 = [...token, input.tkn];

 address= address1;
 amount= amount1;
 token= token1;

}
)
console.log("address: ",address);
console.log("amount :",amount);
console.log("token :", token);
}

onChange =  (event,index,jsj) =>{

      if(index.name === 'tkn')
      {
        const list = [...this.state.obj];
        list[jsj]['tkn'] = index.value;
        this.setState({obj:list});
        console.log(this.state.obj);
      }
      else{
      const { name, value } = event.target;
      const list = [...this.state.obj];
      list[index][name] = value;
      this.setState({obj:list});
    }

};


  render(){
  return (
    <div>
        {this.HeaderExampleFloating()}
        <Button
        style = {{marginRight : '60px', marginTop : '30px'}}
       floated ="right"
       content ="Add"
       icon ="add circle"
       primary
       onClick={ () => this.appendInput() }
       />
        <Container style = {{marginTop : '30px'}}>
        <Segment >
        <Form >
          {this.state.obj.map((input,index) => <Form.Group widths='equal'>
            <Form.Input fluid  placeholder='Address' name="addr" value={input.addr} onChange={(e) =>this.onChange(e,index)}/>
            <Form.Input fluid  placeholder='Amount' name="amt" value={input.amt} onChange={(e) =>this.onChange(e,index)} />
            <Dropdown
        onChange={(e,data) =>this.onChange(e,data,index)}
        name="tkn"
        value={input.tkn}
        placeholder='Select Token'
        fluid
        search
        selection
        options={this.state.token}
      />
          </Form.Group>)}
        </Form>
      </Segment>
      <Container style = {{display: "flex",justifyContent: "center",alignItems: "center", marginBottom : '50px'}}>
      <Button
      positive ={true}
     content ="Submit"
     icon ="ethereum"
     primary
     onClick={ () => this.onSubmit() }
     />
     </Container>
        </Container>

    </div>
  );
}
}

export default App;
