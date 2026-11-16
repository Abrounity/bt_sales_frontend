'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  CalendarDays,
  CheckCheck,
  Eye,
  EyeOff,
  Inbox,
  Mail,
  MessageSquareText,
  Package,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { Product } from '@/data/products';
import { getSpecificationIcon } from '@/lib/product-specifications';
import {
  checkAdminSession,
  createProduct,
  deleteContactMessage,
  deleteProduct,
  fetchContactMessages,
  fetchProducts,
  loginAdmin,
  logoutAdmin,
  updateContactMessageStatus,
  updateProduct,
  uploadProductImage,
  uploadSpecificationIcon,
  type ContactMessage,
  type NewProduct,
} from '@/lib/products-api';

type AdminSection = 'products' | 'messages';
type MessageFilter = 'all' | 'new' | 'read';

type ProductSpecificationDraft = {
  title: string;
  subtitle: string;
  icon: string;
};

type ProductDraft = {
  title: string;
  category: Product['category'];
  brand: string;
  price: string;
  originalPrice: string;
  rating: string;
  reviews: string;
  isBestSeller: boolean;
  badge: string;
  image: string;
  specs: ProductSpecificationDraft[];
  description: string;
};

const initialSpecifications: ProductSpecificationDraft[] = Array.from(
  { length: 4 },
  () => ({ title: '', subtitle: '', icon: '' })
);

const initialDraft: ProductDraft = {
  title: '',
  category: 'phones',
  brand: '',
  price: '',
  originalPrice: '',
  rating: '0',
  reviews: '0',
  isBestSeller: false,
  badge: '',
  image: '',
  specs: initialSpecifications,
  description: '',
};

function parseSpecifications(
  specifications: ProductSpecificationDraft[]
): { specs: Record<string, string>; specIcons: Record<string, string> } {
  const parsed: Record<string, string> = {};
  const specIcons: Record<string, string> = {};
  const titles = new Set<string>();

  specifications.forEach(({ title: rawTitle, subtitle: rawSubtitle, icon }, index) => {
    const title = rawTitle.trim();
    const subtitle = rawSubtitle.trim();

    if (!title || !subtitle) {
      throw new Error(`Enter both a title and subtitle for Specification ${index + 1}.`);
    }

    const normalizedTitle = title.toLowerCase();
    if (titles.has(normalizedTitle)) {
      throw new Error('Each specification title must be unique.');
    }

    titles.add(normalizedTitle);
    parsed[title] = subtitle;
    if (icon) specIcons[title] = icon;
  });

  if (Object.keys(parsed).length < 4) {
    throw new Error('Enter all four required product specifications.');
  }

  return { specs: parsed, specIcons };
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [draft, setDraft] = useState<ProductDraft>(initialDraft);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [uploadingSpecificationIndex, setUploadingSpecificationIndex] = useState<number | null>(null);
  const [uploadingProductImage, setUploadingProductImage] = useState(false);
  const [productImageFileName, setProductImageFileName] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>('products');
  const [messageFilter, setMessageFilter] = useState<MessageFilter>('all');
  const [messageSearch, setMessageSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingMessageId, setUpdatingMessageId] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const productsByCategory = products.reduce(
    (counts, product) => {
      counts[product.category] += 1;
      return counts;
    },
    { phones: 0, appliances: 0, accessories: 0 }
  );
  const newMessageCount = messages.filter((message) => message.status === 'new').length;
  const visibleMessages = messages.filter((message) => {
    const matchesStatus = messageFilter === 'all' || message.status === messageFilter;
    const query = messageSearch.trim().toLowerCase();
    const searchable = `${message.name} ${message.email} ${message.phone} ${message.subject} ${message.message}`.toLowerCase();
    return matchesStatus && (!query || searchable.includes(query));
  });

  useEffect(() => {
    let active = true;

    checkAdminSession()
      .then(async (hasSession) => {
        if (!active) return;
        setAuthenticated(hasSession);
        if (hasSession) {
          setLoadingProducts(true);
          setLoadingMessages(true);
          const [loadedProducts, loadedMessages] = await Promise.all([
            fetchProducts(),
            fetchContactMessages(),
          ]);
          if (active) {
            setProducts(loadedProducts);
            setMessages(loadedMessages);
          }
        }
      })
      .catch((sessionError: unknown) => {
        if (active) {
          setError(sessionError instanceof Error ? sessionError.message : 'Unable to verify admin session.');
        }
      })
      .finally(() => {
        if (active) {
          setCheckingSession(false);
          setLoadingProducts(false);
          setLoadingMessages(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await loginAdmin(email, password);
      setAuthenticated(true);
      setEmail('');
      setPassword('');
      setLoadingProducts(true);
      setLoadingMessages(true);
      const [loadedProducts, loadedMessages] = await Promise.all([
        fetchProducts(),
        fetchContactMessages(),
      ]);
      setProducts(loadedProducts);
      setMessages(loadedMessages);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in.');
    } finally {
      setSaving(false);
      setLoadingProducts(false);
      setLoadingMessages(false);
    }
  }

  function handleEditProduct(product: Product) {
    const specificationEntries = Object.entries(product.specs);
    const specificationIcons = product.specIcons ?? {};
    setEditingProductId(product.id);
    setProductImageFileName('');
    setDraft({
      title: product.title,
      category: product.category,
      brand: product.brand,
      price: String(product.price),
      originalPrice: String(product.originalPrice),
      rating: String(product.rating),
      reviews: String(product.reviews),
      isBestSeller: product.isBestSeller ?? false,
      badge: product.badge || '',
      image: product.image,
      specs: Array.from(
        { length: Math.max(4, specificationEntries.length) },
        (_, index) => {
          const [title = '', subtitle = ''] = specificationEntries[index] ?? [];
          return { title, subtitle, icon: specificationIcons[title] ?? '' };
        }
      ),
      description: product.description,
    });
    setError(null);
    setNotice(null);
    setActiveSection('products');
    document.getElementById('admin-product-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleCancelProductEdit() {
    setEditingProductId(null);
    setDraft(initialDraft);
    setProductImageFileName('');
    setError(null);
  }

  function updateSpecification(
    index: number,
    field: keyof ProductSpecificationDraft,
    value: string
  ) {
    setDraft((current) => ({
      ...current,
      specs: current.specs.map((specification, specificationIndex) =>
        specificationIndex === index
          ? { ...specification, [field]: value }
          : specification
      ),
    }));
  }

  async function handleSpecificationIconUpload(index: number, file?: File) {
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Upload a PNG, JPEG, or WebP icon.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Icon files must be 2 MB or smaller.');
      return;
    }

    setError(null);
    setNotice(null);
    setUploadingSpecificationIndex(index);
    try {
      const iconUrl = await uploadSpecificationIcon(file);
      setDraft((current) => ({
        ...current,
        specs: current.specs.map((specification, specificationIndex) =>
          specificationIndex === index
            ? { ...specification, icon: iconUrl }
            : specification
        ),
      }));
      setNotice(`Icon for Specification ${index + 1} uploaded to Cloudinary.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload icon.');
    } finally {
      setUploadingSpecificationIndex(null);
    }
  }

  async function handleProductImageUpload(file?: File) {
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Upload a PNG, JPEG, or WebP product image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image files must be 2 MB or smaller.');
      return;
    }

    setError(null);
    setNotice(null);
    setUploadingProductImage(true);
    try {
      const imageUrl = await uploadProductImage(file);
      setDraft((current) => ({ ...current, image: imageUrl }));
      setProductImageFileName(file.name);
      setNotice('Product image uploaded');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload product image.');
    } finally {
      setUploadingProductImage(false);
    }
  }

  async function handleSaveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (uploadingProductImage || uploadingSpecificationIndex !== null) {
      setError('Wait for image uploads to finish before saving the product.');
      return;
    }

    try {
      const { specs, specIcons } = parseSpecifications(draft.specs);
      const newProduct: NewProduct = {
        title: draft.title.trim(),
        category: draft.category,
        brand: draft.brand.trim(),
        price: Number(draft.price),
        originalPrice: Number(draft.originalPrice),
        rating: Number(draft.rating),
        reviews: Number(draft.reviews),
        isBestSeller: draft.isBestSeller,
        badge: draft.badge.trim() || undefined,
        image: draft.image.trim(),
        specs,
        specIcons,
        description: draft.description.trim(),
      };

      setSaving(true);
      if (editingProductId) {
        const updated = await updateProduct(editingProductId, newProduct);
        setProducts((current) =>
          current.map((product) => (product.id === updated.id ? updated : product))
        );
        setNotice(`${updated.title} was updated.`);
      } else {
        const created = await createProduct(newProduct);
        setProducts((current) => [created, ...current]);
        setNotice(`${created.title} was added to MongoDB.`);
      }
      setDraft(initialDraft);
      setProductImageFileName('');
      setEditingProductId(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProduct(product: Product) {
    if (!window.confirm(`Delete "${product.title}"? This cannot be undone.`)) return;

    setError(null);
    setNotice(null);
    setDeletingId(product.id);
    try {
      await deleteProduct(product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      if (editingProductId === product.id) {
        setEditingProductId(null);
        setDraft(initialDraft);
        setProductImageFileName('');
      }
      setNotice(`${product.title} was deleted.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete product.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleMessageStatus(message: ContactMessage) {
    setError(null);
    setNotice(null);
    setUpdatingMessageId(message.id);
    try {
      const updated = await updateContactMessageStatus(
        message.id,
        message.status === 'new' ? 'read' : 'new'
      );
      setMessages((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      setNotice(updated.status === 'read' ? 'Message marked as read.' : 'Message marked as new.');
    } catch (messageError) {
      setError(messageError instanceof Error ? messageError.message : 'Unable to update message.');
    } finally {
      setUpdatingMessageId(null);
    }
  }

  async function handleDeleteMessage(message: ContactMessage) {
    if (!window.confirm(`Delete the inquiry from "${message.name}"? This cannot be undone.`)) {
      return;
    }
    setError(null);
    setNotice(null);
    setDeletingMessageId(message.id);
    try {
      await deleteContactMessage(message.id);
      setMessages((current) => current.filter((item) => item.id !== message.id));
      setNotice('Contact message deleted.');
    } catch (messageError) {
      setError(messageError instanceof Error ? messageError.message : 'Unable to delete message.');
    } finally {
      setDeletingMessageId(null);
    }
  }

  async function handleLogout() {
    setError(null);
    try {
      await logoutAdmin();
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'Unable to sign out.');
    } finally {
      setAuthenticated(false);
      setProducts([]);
      setMessages([]);
      setEditingProductId(null);
      setDraft(initialDraft);
      setProductImageFileName('');
    }
  }

  if (checkingSession) {
    return <main className="container page-shell" role="status">Checking admin session...</main>;
  }

  if (!authenticated) {
    return (
      <main className="admin-auth-page">
        <section className="admin-auth-card">
          <div className="admin-auth-intro">
            <div className="admin-auth-brand">
              <span className="admin-auth-logo">BT</span>
              <span>BT SALES <span className="admin-auth-brand-subtitle">INDIA</span></span>
            </div>
            <div className="admin-auth-intro-copy">
              <span className="admin-auth-eyebrow">STORE MANAGEMENT</span>
              <h1>Your store,<br />all in one place.</h1>
              <p>Sign in to manage products, update your catalog, and keep your storefront up to date.</p>
            </div>
            <div className="admin-auth-secure">
              <ShieldCheck size={18} aria-hidden="true" />
              <span>Secure administrator access</span>
            </div>
          </div>

          <div className="admin-auth-form-panel">
            <div className="admin-auth-form-heading">
              <span className="admin-auth-eyebrow">ADMIN PORTAL</span>
              <h2>Welcome back</h2>
              <p>Enter your administrator credentials to continue.</p>
            </div>
            {error && <p className="admin-auth-error" role="alert">{error}</p>}
            <form onSubmit={handleLogin} className="admin-auth-form">
              <label>
                <span>Admin email</span>
                <input
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                />
              </label>
              <label>
                <span>Password</span>
                <span className="admin-auth-password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="admin-auth-password-toggle"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>
              <button type="submit" disabled={saving} className="admin-auth-submit">
                {saving ? 'Signing in...' : 'Sign in to dashboard'}
              </button>
            </form>
            <p className="admin-auth-footnote">Authorized administrators only</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div>
          <span className="admin-dashboard-kicker">BT SALES / ADMIN</span>
          <h1>Dashboard</h1>
          <p>Manage your storefront products and customer inquiries.</p>
        </div>
        <button type="button" onClick={handleLogout} className="admin-signout-button">
          Sign out
        </button>
      </header>

      <section aria-label="Store overview" className="admin-dashboard-stats">
        <article className="admin-stat-card">
          <span className="admin-stat-icon admin-stat-icon-red"><Package size={19} /></span>
          <div><p>Total products</p><strong>{products.length}</strong></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-icon admin-stat-icon-blue"><MessageSquareText size={19} /></span>
          <div><p>Customer messages</p><strong>{messages.length}</strong></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-icon admin-stat-icon-amber"><Inbox size={19} /></span>
          <div><p>Needs attention</p><strong>{newMessageCount}</strong></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-icon admin-stat-icon-green"><CheckCheck size={19} /></span>
          <div><p>Phones & tablets</p><strong>{productsByCategory.phones}</strong></div>
        </article>
      </section>

      <nav className="admin-dashboard-tabs" aria-label="Dashboard sections">
        <button
          type="button"
          className={activeSection === 'products' ? 'active' : ''}
          onClick={() => setActiveSection('products')}
        >
          <Package size={17} /> Products <span>{products.length}</span>
        </button>
        <button
          type="button"
          className={activeSection === 'messages' ? 'active' : ''}
          onClick={() => setActiveSection('messages')}
        >
          <Inbox size={17} /> Contact messages
          <span>{newMessageCount} new</span>
        </button>
      </nav>

      {error && <p className="admin-dashboard-alert error" role="alert">{error}</p>}
      {notice && <p className="admin-dashboard-alert success" role="status">{notice}</p>}

      {activeSection === 'products' ? (
        <div className="admin-dashboard-content">
          <section className="admin-dashboard-panel" id="admin-product-form">
            <div className="admin-panel-heading">
              <span className="admin-panel-heading-icon">
                {editingProductId ? <Pencil size={18} /> : <Plus size={19} />}
              </span>
              <div>
                <h2>{editingProductId ? 'Edit product' : 'Add a product'}</h2>
                <p>
                  {editingProductId
                    ? 'Update the product details shown in your online catalog.'
                    : 'Publish product details to your online catalog.'}
                </p>
              </div>
            </div>
            <form onSubmit={handleSaveProduct} className="admin-product-form">
              <label>
                Product name
                <input required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="admin-input" placeholder="e.g. Galaxy S25 Ultra" />
              </label>
              <label>
                Brand
                <input required value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} className="admin-input" placeholder="e.g. Samsung" />
              </label>
              <label>
                Category
                <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as Product['category'] })} className="admin-input">
                  <option value="phones">Phones & tablets</option>
                  <option value="appliances">Appliances</option>
                  <option value="accessories">Accessories</option>
                </select>
              </label>
              <label>
                Badge <span className="admin-field-optional">Optional</span>
                <input value={draft.badge} onChange={(e) => setDraft({ ...draft, badge: e.target.value })} className="admin-input" placeholder="e.g. Best Seller" />
              </label>
              <label>
                Selling price (₹)
                <input type="number" min="0" step="0.01" required value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} className="admin-input" />
              </label>
              <label>
                Original price (₹)
                <input type="number" min="0" step="0.01" required value={draft.originalPrice} onChange={(e) => setDraft({ ...draft, originalPrice: e.target.value })} className="admin-input" />
              </label>
              <label>
                Rating <span className="admin-field-optional">0 to 5</span>
                <input type="number" min="0" max="5" step="0.1" required value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: e.target.value })} className="admin-input" />
              </label>
              <label>
                Review count
                <input type="number" min="0" step="1" required value={draft.reviews} onChange={(e) => setDraft({ ...draft, reviews: e.target.value })} className="admin-input" />
              </label>
              <div className="admin-product-image-field admin-form-wide">
                <label htmlFor="admin-product-image">
                  Product image{draft.title.trim() ? ` for ${draft.title.trim()}` : ''}
                </label>
                {/* <input
                  id="admin-product-image"
                  required
                  value={draft.image}
                  onChange={(e) => {
                    setDraft({ ...draft, image: e.target.value });
                    setProductImageFileName('');
                  }}
                  className="admin-input"
                  placeholder="Paste an image URL or upload an image"
                /> */}
                <div className="admin-product-image-controls">
                  <label className="admin-image-upload-control">
                    <Upload size={15} aria-hidden="true" />
                    {uploadingProductImage ? 'Uploading...' : 'Upload product image'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      aria-label="Upload product image"
                      disabled={saving || uploadingProductImage || uploadingSpecificationIndex !== null}
                      onChange={(event) => {
                        void handleProductImageUpload(event.currentTarget.files?.[0]);
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                  {draft.image && (
                    <div className="admin-product-image-details">
                      <img
                        className="admin-product-image-preview"
                        src={draft.image}
                        alt={`${draft.title || 'Product'} image preview`}
                      />
                      <span className="admin-product-image-name">
                        <strong>{draft.title || 'Product image'}</strong>
                        <span>{productImageFileName || 'Current image'}</span>
                      </span>
                      <button
                        type="button"
                        className="admin-product-image-remove"
                        onClick={() => {
                          setDraft((current) => ({ ...current, image: '' }));
                          setProductImageFileName('');
                        }}
                        disabled={saving || uploadingProductImage}
                      >
                        <X size={14} aria-hidden="true" />
                        Remove image
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <fieldset className="admin-specifications-editor admin-form-wide">
                <legend>Specifications</legend>
                <p className="admin-specifications-help">
                  Add four specification titles and subtitles. Each title selects a matching icon by default; upload an image to use a custom icon.
                </p>
                <div className="admin-specifications-list">
                  {draft.specs.map((specification, index) => {
                    const SpecificationIcon = getSpecificationIcon(specification.title);

                    return (
                      <div className="admin-specification-card" key={index}>
                        <span className="admin-specification-icon" aria-hidden="true">
                          {specification.icon ? (
                            <img src={specification.icon} alt="" />
                          ) : (
                            <SpecificationIcon size={18} />
                          )}
                        </span>
                        <div className="admin-specification-fields">
                          <div className="admin-specification-heading">
                            <h3>Specification {index + 1}</h3>
                            <label className="admin-specification-upload">
                              <Upload size={14} aria-hidden="true" />
                              {uploadingSpecificationIndex === index
                                ? 'Uploading...'
                                : specification.icon ? 'Replace icon' : 'Upload icon'}
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                aria-label={`Upload icon for Specification ${index + 1}`}
                                disabled={saving || uploadingProductImage || uploadingSpecificationIndex !== null}
                                onChange={(event) => {
                                  void handleSpecificationIconUpload(
                                    index,
                                    event.currentTarget.files?.[0]
                                  );
                                  event.currentTarget.value = '';
                                }}
                              />
                            </label>
                            {specification.icon && (
                              <button
                                type="button"
                                className="admin-specification-remove"
                                onClick={() => updateSpecification(index, 'icon', '')}
                                disabled={saving || uploadingProductImage || uploadingSpecificationIndex !== null}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <label>
                            Title
                            <input
                              required
                              value={specification.title}
                              onChange={(event) =>
                                updateSpecification(index, 'title', event.target.value)
                              }
                              className="admin-input"
                              placeholder="e.g. Display"
                            />
                          </label>
                          <label>
                            Subtitle
                            <input
                              required
                              value={specification.subtitle}
                              onChange={(event) =>
                                updateSpecification(index, 'subtitle', event.target.value)
                              }
                              className="admin-input"
                              placeholder="e.g. 6.7-inch AMOLED"
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </fieldset>
              <label className="admin-form-wide">
                Description
                <textarea required rows={4} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="admin-input" placeholder="Tell customers what makes this product special." />
              </label>
              <label className="admin-best-seller-toggle admin-form-wide">
                <input
                  type="checkbox"
                  checked={draft.isBestSeller}
                  onChange={(e) => setDraft({ ...draft, isBestSeller: e.target.checked })}
                />
                <span className="admin-best-seller-copy">
                  <strong>Show in Best Sellers on the home page</strong>
                  <span>Enable this to feature the product in the home page Best Sellers section.</span>
                </span>
              </label>
              <div className="admin-product-form-actions admin-form-wide">
                <button
                  type="submit"
                  disabled={saving || uploadingProductImage || uploadingSpecificationIndex !== null}
                  className="admin-primary-button"
                >
                  {editingProductId ? <Pencil size={16} /> : <Plus size={17} />}
                  {saving
                    ? editingProductId ? 'Updating product...' : 'Saving product...'
                    : editingProductId ? 'Update product' : 'Save product to MongoDB'}
                </button>
                {editingProductId && (
                  <button
                    type="button"
                    disabled={saving || uploadingProductImage || uploadingSpecificationIndex !== null}
                    onClick={handleCancelProductEdit}
                    className="admin-cancel-button"
                  >
                    <X size={16} /> Cancel edit
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="admin-dashboard-panel">
            <div className="admin-panel-heading admin-inventory-heading">
              <div>
                <h2>Product inventory</h2>
                <p>Products currently available in your catalog.</p>
              </div>
              <span className="admin-total-pill">{products.length} items</span>
            </div>
            {loadingProducts ? (
              <p className="admin-empty-state" role="status">Loading products...</p>
            ) : products.length === 0 ? (
              <p className="admin-empty-state">Your catalog is empty. Add your first product above.</p>
            ) : (
              <ul className="admin-product-list">
                {products.map((product) => (
                  <li key={product.id} className="admin-product-row">
                    <img src={product.image} alt="" />
                    <div className="admin-product-info">
                      <strong>{product.title}</strong>
                      <span>{product.brand} · {product.category}</span>
                    </div>
                    <strong className="admin-product-price">₹{product.price.toLocaleString('en-IN')}</strong>
                    <div className="admin-product-actions">
                      <button
                        type="button"
                        onClick={() => handleEditProduct(product)}
                        className="admin-icon-button edit"
                        aria-label={`Edit ${product.title}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === product.id}
                        onClick={() => handleDeleteProduct(product)}
                        className="admin-icon-button delete"
                        aria-label={`Delete ${product.title}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <section className="admin-dashboard-panel admin-inbox-panel">
          <div className="admin-panel-heading admin-inbox-heading">
            <div>
              <h2>Customer inquiries</h2>
              <p>Messages submitted through the Contact Us page.</p>
            </div>
            <span className="admin-total-pill">{newMessageCount} new</span>
          </div>
          <div className="admin-message-toolbar">
            <label className="admin-message-search">
              <Search size={17} aria-hidden="true" />
              <input
                value={messageSearch}
                onChange={(event) => setMessageSearch(event.target.value)}
                placeholder="Search name, phone, email, or message"
                aria-label="Search contact messages"
              />
            </label>
            <select
              value={messageFilter}
              onChange={(event) => setMessageFilter(event.target.value as MessageFilter)}
              aria-label="Filter contact messages"
              className="admin-message-filter"
            >
              <option value="all">All messages</option>
              <option value="new">New</option>
              <option value="read">Read</option>
            </select>
          </div>
          {loadingMessages ? (
            <p className="admin-empty-state" role="status">Loading customer messages...</p>
          ) : visibleMessages.length === 0 ? (
            <div className="admin-message-empty">
              <span><Inbox size={24} /></span>
              <strong>{messages.length ? 'No matching messages' : 'Your inbox is clear'}</strong>
              <p>{messages.length ? 'Try another search or filter.' : 'New customer inquiries will appear here.'}</p>
            </div>
          ) : (
            <div className="admin-message-list">
              {visibleMessages.map((message) => (
                <article key={message.id} className={`admin-message-card ${message.status === 'new' ? 'is-new' : ''}`}>
                  <div className="admin-message-topline">
                    <div className="admin-message-avatar">{message.name.trim().charAt(0).toUpperCase()}</div>
                    <div className="admin-message-sender">
                      <strong>{message.name}</strong>
                      <span>{message.email || 'No email provided'} · {message.phone}</span>
                    </div>
                    <span className={`admin-message-status ${message.status}`}>
                      {message.status === 'new' ? 'New' : 'Read'}
                    </span>
                  </div>
                  <h3>{message.subject}</h3>
                  <p className="admin-message-body">{message.message}</p>
                  <div className="admin-message-footer">
                    <span className="admin-message-date">
                      <CalendarDays size={14} />
                      {new Date(message.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                    <div className="admin-message-actions">
                      {message.email && (
                        <a className="admin-message-action" href={`mailto:${message.email}`} aria-label={`Email ${message.name}`}>
                          <Mail size={15} /> Reply
                        </a>
                      )}
                      <button
                        type="button"
                        disabled={updatingMessageId === message.id}
                        onClick={() => handleToggleMessageStatus(message)}
                        className="admin-message-action"
                      >
                        <CheckCheck size={15} />
                        {message.status === 'new' ? 'Mark read' : 'Mark new'}
                      </button>
                      <button
                        type="button"
                        disabled={deletingMessageId === message.id}
                        onClick={() => handleDeleteMessage(message)}
                        className="admin-message-action danger"
                        aria-label={`Delete message from ${message.name}`}
                      >
                        <Trash2 size={15} /> Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
