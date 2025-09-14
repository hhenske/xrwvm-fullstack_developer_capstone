import React, { useState, useEffect } from 'react';
import "./Dealers.css";
import "../assets/style.css";
import Header from '../Header/Header';
import review_icon from "../assets/reviewicon.png"

const Dealers = () => {
  const [dealersList, setDealersList] = useState([]);
  // let [state, setState] = useState("")
  let [states, setStates] = useState([])

  // let root_url = window.location.origin
//   let dealer_url ="/djangoapp/get_dealerships/";
  
//   let dealer_url_by_state = "/djangoapp/get_dealerships/";
 
  const filterDealers = async (state) => {
    let url = state === "All" ? "/djangoapp/get_dealerships/" : `/djangoapp/get_dealerships/${state}/`;
    const res = await fetch(url, { method: "GET" });
    const retobj = await res.json();
    if (retobj.status === 200) {
      setDealersList(Array.from(retobj.dealers));
    }
  };

  const get_dealers = async () => {
    console.log("get_dealers CALLED");
    const res = await fetch("/djangoapp/get_dealerships/", { method: "GET" });
    console.log("Raw response:", res.status, res.statusText);   // 👈
    const retobj = await res.json().catch(e => {
        console.error("JSON parse error:", e);
        return {};
    });
    console.log("Parsed JSON:", retobj);   // 👈
    if (retobj.status === 200 && retobj.dealers) {
        const all_dealers = Array.from(retobj.dealers);
        const states = Array.from(new Set(all_dealers.map(d => d.state)));
        setStates(states);
        setDealersList(all_dealers);
    } else {
        console.warn("Unexpected response format:", retobj);
    }
    };
    
  useEffect(() => {
    get_dealers();
  },[]);  


let isLoggedIn = sessionStorage.getItem("username") != null ? true : false;
return(
  <div>
      <Header/>

     <table className='table'>
      <tr>
      <th>ID</th>
      <th>Dealer Name</th>
      <th>City</th>
      <th>Address</th>
      <th>Zip</th>
      <th>
      <select name="state" id="state" onChange={(e) => filterDealers(e.target.value)}>
      <option value="" selected disabled hidden>State</option>
      <option value="All">All States</option>
      {states.map(state => (
          <option value={state}>{state}</option>
      ))}
      </select>        

      </th>
      {isLoggedIn ? (
          <th>Review Dealer</th>
         ):<></>
      }
      </tr>
     {dealersList.map(dealer => (
        <tr>
          <td>{dealer['id']}</td>
          <td><a href={'/dealer/'+dealer['id']}>{dealer['full_name']}</a></td>
          <td>{dealer['city']}</td>
          <td>{dealer['address']}</td>
          <td>{dealer['zip']}</td>
          <td>{dealer['state']}</td>
          {isLoggedIn ? (
            <td><a href={`/postreview/${dealer['id']}`}><img src={review_icon} className="review_icon" alt="Post Review"/></a></td>
           ):<></>
          }
        </tr>
      ))}
     </table>;
  </div>
)
}

export default Dealers
