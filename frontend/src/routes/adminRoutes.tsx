import AuthGuard from "../components/AuthGuard";
import Admin from "../pages/Admin";
import ProductDetails from "../pages/admin/ProductDetails";

export const adminRoutes = {
  path: "/admin",
  element: <AuthGuard roles={["admin", "staff"]} />,
  children: [
    {
      index: true,
      element: <Admin />,
    },
    {
      path: "products/:productId/details",
      element: <ProductDetails />,
    },
    // Dễ dàng thêm các route admin khác
    // {
    //   path: "users",
    //   element: <AdminUsers />,
    // },
    // {
    //   path: "settings",
    //   element: <AdminSettings />,
    // },
  ],
};