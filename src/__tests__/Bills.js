// /**
//  * @jest-environment jsdom
//  */

import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import store from "../__mocks__/store.js";
import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { bills } from "../fixtures/bills";
import router from "../app/Router";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      expect(windowIcon.className).toBe("active-icon");
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);

      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });
});

describe("When I click on eye icon", () => {
  test("then modalfile should be opened", () => {
    document.body.innerHTML = BillsUI({ data: bills });

    const iconEyes = screen.getAllByTestId("icon-eye");
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    const billsClass = new Bills({
      document,
      onNavigate,
      store,
      localStorage: window.localStorage,
    });
    const handleClickIconEye = jest.fn(() =>
      billsClass.handleClickIconEye(iconEyes[0])
    );
    iconEyes[0].addEventListener("click", handleClickIconEye);
    userEvent.click(iconEyes[0]);
    const billProof = document.querySelector(".bill-proof-container");
    const openModal = document.querySelector("#modaleFile");
    expect(handleClickIconEye).toHaveBeenCalled();
    expect(billProof).toBeTruthy();
    expect(openModal).toBeTruthy();
  });
});

// test d'intégration GET
describe("Given I am a user connected as an Employee", () => {
  describe("When I navigate to Bills page", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });
    test("fetches bills from mock API GET", async () => {
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const contentTitle = screen.getByText("Mes notes de frais");
      expect(contentTitle).toBeTruthy();
      const buttonNewBill = screen.getByTestId("btn-new-bill");
      expect(buttonNewBill).toBeTruthy();
      const table = document.querySelector("#data-table");
      expect(table).toBeTruthy();
      const tableBody = screen.getByTestId("tbody");
      expect(tableBody).toBeTruthy();
    });

    describe("When an error occurs on API", () => {
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
