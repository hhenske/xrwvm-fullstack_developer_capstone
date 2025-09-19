import React, { useState, useEffect } from "react";
import "./Dealers.css";
import "../assets/style.css";
import Header from "../Header/Header";
import review_icon from "../assets/reviewicon.png";

const Dealers = () => {
  const [dealersList, setDealersList] = useState([]);
  const [states, setStates] = useState([]);

  useEffect(() => {
    filterDealers("All");
  }, []);

  // ✅ Define before use
  const filterDealers = async (state) => {
    let url =
      state === "All"
        ? "/djangoapp/get_dealerships/"
        : `/djangoapp/get_dealerships/${state}/`;
    try {
      const res = await fetch(url, { method: "GET" });
      const retobj = await res.json();
      if (retobj.status === 200 && retobj.dealers) {
        const dealersArray = Array.from(retobj.dealers);
        setDealersList(dealersArray);
        
        // Extract unique states only when fetching all dealers
        if (state === "All") {
          const uniqueStates = [...new Set(dealersArray.map(dealer => dealer.state))].sort();
          setStates(uniqueStates);
        }
      }
    } catch (err) {
      console.error("Filter failed:", err);
    }
  };

  let isLoggedIn = sessionStorage.getItem("username") != null;

  return (
    <div>
      <Header />

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Dealer Name</th>
            <th>City</th>
            <th>Address</th>
            <th>Zip</th>
            <th>
              <select
                name="state"
                id="state"
                defaultValue=""
                onChange={(e) => filterDealers(e.target.value)}
              >
                <option value="" disabled hidden>
                  State
                </option>
                <option value="All">All States</option>
                {states.map((state, idx) => (
                  <option key={idx} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </th>
            {isLoggedIn && <th>Review Dealer</th>}
          </tr>
        </thead>
        <tbody>
          {dealersList.map((dealer) => (
            <tr key={dealer.id}>
              <td>{dealer.id}</td>
              <td>
                <a href={`/dealer/${dealer.id}`}>{dealer.full_name}</a>
              </td>
              <td>{dealer.city}</td>
              <td>{dealer.address}</td>
              <td>{dealer.zip}</td>
              <td>{dealer.state}</td>
              {isLoggedIn && (
                <td>
                  <a href={`/postreview/${dealer.id}`}>
                    <img
                      src={review_icon}
                      className="review_icon"
                      alt="Post Review"
                    />
                  </a>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dealers;