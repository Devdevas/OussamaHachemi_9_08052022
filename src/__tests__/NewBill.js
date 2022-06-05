/**
 * @jest-environment jsdom
 */

import NewBill from "../containers/NewBill.js";
import store from "../__mocks__/store.js";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { bills } from "../fixtures/bills";
import router from "../app/Router";
import NewBillUI from "../views/NewBillUI.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      document.body.innerHTML = `<div id="root"></div>`;
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
    });

    test("Then New bill page should appear", async () => {
      await waitFor(() => screen.getByText("Envoyer une note de frais"));
      const contentTitle = screen.getByText("Envoyer une note de frais");
      expect(contentTitle).toBeTruthy();
      const formNewBill = screen.getByTestId("form-new-bill");
      expect(formNewBill).toBeTruthy();
      const submitBtn = screen.getByText("Envoyer");
      expect(submitBtn).toBeTruthy();
    });

    test("Then mail icon in vertical layout should be highlighted", async () => {
      await waitFor(() => screen.getByTestId("icon-mail"));
      const mailIcon = screen.getByTestId("icon-mail");
      expect(mailIcon.className).toBe("active-icon");
    });

    describe("When I upload a valid file type", () => {
      test("Then alert message should not appear", () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          locolaStorage: window.localStorage,
        });
        jest.spyOn(window, "alert");
        const fileInput = document.querySelector(`input[data-testid="file"]`);
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
        fileInput.addEventListener("change", handleChangeFile);
        fireEvent.change(fileInput, {
          target: {
            files: [new File([], "test.jpg", { type: "image/jpg" })],
          },
        });
        expect(handleChangeFile).toHaveBeenCalled();
        expect(window.alert).not.toHaveBeenCalled();
      });
    });

    describe("When I upload an invalid file type", () => {
      test("Then alert message should appear", () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          locolaStorage: window.localStorage,
        });

        jest.spyOn(window, "alert");
        const fileInput = document.querySelector(`input[data-testid="file"]`);
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
        fileInput.addEventListener("change", handleChangeFile);
        fireEvent.change(fileInput, {
          target: {
            files: [new File([], "test.pdf", { type: "pdf" })],
          },
        });
        expect(handleChangeFile).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalled();
      });
    });

    describe("When I click on submit button", () => {
      test("Then form should be submitted", () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          locolaStorage: window.localStorage,
        });

        const date = new Date();
        const year = date.getFullYear();
        const month = ("0" + (date.getMonth() + 1)).slice(-2);
        const day = String(date.getDate()).padStart(2, "0");
        const inputDate = screen.getByTestId("datepicker");
        inputDate.valueAsDate = date;
        const datePattern = year + "-" + month + "-" + day;
        expect(inputDate.value).toBe(datePattern);

        const fileInput = document.querySelector(`input[data-testid="file"]`);
        fireEvent.change(fileInput, {
          target: {
            files: [new File([], "test.jpg", { type: "image/jpg" })],
          },
        });
        expect(fileInput.files[0].name).toBe("test.jpg");

        const amountInput = screen.getByTestId("amount");
        fireEvent.change(amountInput, { target: { value: "100" } });
        expect(amountInput.value).toBe("100");

        const vatInput = screen.getByTestId("vat");
        fireEvent.change(vatInput, { target: { value: "70" } });
        expect(vatInput.value).toBe("70");

        const pctInput = screen.getByTestId("pct");
        fireEvent.change(pctInput, { target: { value: "20" } });
        expect(pctInput.value).toBe("20");

        const formNewBill = document.querySelector(
          `form[data-testid="form-new-bill"]`
        );

        const handleSubmit = jest.fn(() => newBill.handleSubmit);
        formNewBill.addEventListener("submit", handleSubmit);
        fireEvent.submit(formNewBill);

        const path = window.location.href;

        expect(handleSubmit).toHaveBeenCalled();
        expect(path).toBe("http://localhost/#employee/bills");
      });
    });
  });
});
