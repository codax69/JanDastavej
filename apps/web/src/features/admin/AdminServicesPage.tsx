import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Layers,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  ExternalLink,
  Shield,
  Building,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { Button } from '../../components/ui/Button.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Input } from '../../components/ui/Input.js';
import { Textarea } from '../../components/ui/Textarea.js';
import { Select } from '../../components/ui/Select.js';
import { Alert } from '../../components/ui/Alert.js';
import { TableSkeleton } from '../../components/ui/Skeleton.js';
import { ServiceCategorySchema } from '@jandastavej/shared';

const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  revenue: 'Revenue (મહેસૂલ)',
  social_welfare: 'Social Welfare (સમાજ કલ્યાણ)',
  civil_supplies: 'Civil Supplies & Ration (અન્ન અને નાગરિક પુરવઠો)',
  urban_development: 'Urban Development (શહેરી વિકાસ)',
  legal_affairs: 'Legal Affairs (કાનૂની બાબતો)',
  general_administration: 'General Administration (સામાન્ય વહીવટ)',
};

const CATEGORY_OPTIONS = ServiceCategorySchema.options.map((cat) => ({
  value: cat,
  label: SERVICE_CATEGORY_LABELS[cat] || cat,
}));

export function AdminServicesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [titleGu, setTitleGu] = useState('');
  const [slug, setSlug] = useState('');
  const [department, setDepartment] = useState('Revenue Department');
  const [departmentGu, setDepartmentGu] = useState('મહેસૂલ વિભાગ');
  const [category, setCategory] = useState('revenue');
  const [jurisdiction, setJurisdiction] = useState('Gujarat (Statewide)');
  const [effectiveDate, setEffectiveDate] = useState('2026-01-01');
  const [sourceReference, setSourceReference] = useState('Govt. Resolution / Circular Ref');
  const [description, setDescription] = useState('');
  const [descriptionGu, setDescriptionGu] = useState('');
  const [purpose, setPurpose] = useState('');
  const [purposeGu, setPurposeGu] = useState('');
  const [selectedTemplates, setSelectedTemplates] = useState<
    Array<{
      templateSlug: string;
      templateTitle: string;
      templateTitleGu: string;
      isMandatory: boolean;
      category: string;
      notes?: string;
    }>
  >([]);

  // Steps
  const [stepInput, setStepInput] = useState('');
  const [stepInputGu, setStepInputGu] = useState('');
  const [steps, setSteps] = useState<string[]>([
    'Fill citizen information in single unified form',
    'Review preview of all bundled affidavits and declarations',
    'Download combined PDF for submission at Jan Seva Kendra / Portal',
  ]);
  const [stepsGu, setStepsGu] = useState<string[]>([
    'એક જ ફોર્મમાં નાગરિક વિગતો ભરો',
    'તમામ સોગંદનામા અને એકરારનામાનું પ્રીવ્યૂ ચકાસો',
    'જન સેવા કેન્દ્ર અથવા પોર્ટલ માટે PDF ડાઉનલોડ કરો',
  ]);

  // Query all services
  const { data: servicesData, isLoading, refetch } = useQuery({
    queryKey: ['admin-services'],
    queryFn: () => api.getAdminServices(),
  });

  // Query templates for checklist picker
  const { data: templatesData } = useQuery({
    queryKey: ['admin-templates-picker'],
    queryFn: () => api.getTemplates(),
  });

  const availableTemplates = templatesData?.data || [];
  const services = servicesData?.data || [];

  const filteredServices = useMemo(() => {
    return services.filter((s: any) => {
      const matchesSearch =
        search === '' ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        (s.titleGu && s.titleGu.includes(search)) ||
        s.department.toLowerCase().includes(search.toLowerCase()) ||
        s.slug.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
      const matchesDept = departmentFilter === 'all' || s.department === departmentFilter;

      return matchesSearch && matchesCategory && matchesDept;
    });
  }, [services, search, categoryFilter, departmentFilter]);

  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s: any) => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set);
  }, [services]);

  const resetForm = () => {
    setTitle('');
    setTitleGu('');
    setSlug('');
    setDepartment('Revenue Department');
    setDepartmentGu('મહેસૂલ વિભાગ');
    setCategory('revenue');
    setJurisdiction('Gujarat (Statewide)');
    setEffectiveDate('2026-01-01');
    setSourceReference('Govt. Resolution / Circular Ref');
    setDescription('');
    setDescriptionGu('');
    setPurpose('');
    setPurposeGu('');
    setSelectedTemplates([]);
    setSteps([]);
    setStepsGu([]);
    setEditingService(null);
    setFormError(null);
    setFormSuccess(null);
  };

  const openEditModal = (service: any) => {
    setEditingService(service);
    setTitle(service.title || '');
    setTitleGu(service.titleGu || '');
    setSlug(service.slug || '');
    setDepartment(service.department || 'Revenue Department');
    setDepartmentGu(service.departmentGu || 'મહેસૂલ વિભાગ');
    setCategory(service.category || 'revenue');
    setJurisdiction(service.jurisdiction || 'Gujarat (Statewide)');
    setEffectiveDate(service.effectiveDate || '2026-01-01');
    setSourceReference(service.sourceReference || '');
    setDescription(service.description || '');
    setDescriptionGu(service.descriptionGu || '');
    setPurpose(service.purpose || '');
    setPurposeGu(service.purposeGu || '');
    setSelectedTemplates(service.requiredTemplates || []);
    setSteps(service.steps && service.steps.length > 0 ? service.steps : []);
    setStepsGu(service.stepsGu && service.stepsGu.length > 0 ? service.stepsGu : []);
    setShowCreateModal(true);
  };

  const handleToggleTemplate = (tpl: any) => {
    const existingIndex = selectedTemplates.findIndex((t) => t.templateSlug === tpl.slug);
    if (existingIndex >= 0) {
      setSelectedTemplates(selectedTemplates.filter((t) => t.templateSlug !== tpl.slug));
    } else {
      setSelectedTemplates([
        ...selectedTemplates,
        {
          templateSlug: tpl.slug,
          templateTitle: tpl.title,
          templateTitleGu: tpl.titleGu || tpl.title,
          isMandatory: true,
          category: tpl.category || 'declaration',
        },
      ]);
    }
  };

  const handleAddStep = () => {
    if (!stepInput.trim()) return;
    setSteps([...steps, stepInput.trim()]);
    setStepsGu([...stepsGu, stepInputGu.trim() || stepInput.trim()]);
    setStepInput('');
    setStepInputGu('');
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
    setStepsGu(stepsGu.filter((_, i) => i !== index));
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !titleGu.trim()) {
      setFormError('Both English and Gujarati titles are required.');
      return;
    }
    if (selectedTemplates.length === 0) {
      setFormError('Please select at least 1 required document template.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      title: title.trim(),
      titleGu: titleGu.trim(),
      slug: slug.trim() || undefined,
      department: department.trim(),
      departmentGu: departmentGu.trim(),
      category,
      jurisdiction: jurisdiction.trim(),
      effectiveDate,
      sourceReference: sourceReference.trim(),
      description: description.trim() || title.trim(),
      descriptionGu: descriptionGu.trim() || titleGu.trim(),
      purpose: purpose.trim(),
      purposeGu: purposeGu.trim(),
      requiredTemplates: selectedTemplates,
      steps,
      stepsGu,
    };

    try {
      if (editingService) {
        await api.updateAdminService(editingService._id, payload);
        setFormSuccess('Service updated successfully.');
      } else {
        await api.createAdminService(payload);
        setFormSuccess('Service created successfully.');
      }
      setTimeout(() => {
        setShowCreateModal(false);
        resetForm();
        refetch();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetireService = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to retire service: "${name}"?`)) return;
    try {
      await api.deleteAdminService(id);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to retire service.');
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-6 rounded-xl border border-border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to="/admin/templates"
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Admin Center</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-xs font-semibold text-primary">Citizen Services Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Government Services & Document Bundles
          </h1>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Configure citizen-centric government services, link required statutory templates, and orchestrate single-entry multi-document generation workflows.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="gap-2 font-bold shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Service</span>
          </Button>

          <Link to="/services">
            <Button variant="outline" className="gap-1.5 text-xs">
              <ExternalLink className="h-4 w-4" />
              <span>Public Directory</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Analytics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-primary">
          <div className="text-xs font-semibold text-muted-foreground">Total Services</div>
          <div className="text-2xl font-black text-foreground mt-1">{services.length}</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-success">
          <div className="text-xs font-semibold text-muted-foreground">Active Bundles</div>
          <div className="text-2xl font-black text-success mt-1">
            {services.filter((s: any) => s.status === 'active').length}
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-primary/60">
          <div className="text-xs font-semibold text-muted-foreground">Departments</div>
          <div className="text-2xl font-black text-foreground mt-1">{uniqueDepartments.length}</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-warning">
          <div className="text-xs font-semibold text-muted-foreground">Total Linked Templates</div>
          <div className="text-2xl font-black text-foreground mt-1">
            {services.reduce((acc: number, s: any) => acc + (s.requiredTemplates?.length || 0), 0)}
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, department, or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-md border border-input bg-background"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-md border border-input bg-background font-medium"
            >
              <option value="all">All Departments</option>
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-md border border-input bg-background font-medium"
            >
              <option value="all">All Categories</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Services Table */}
      <Card className="overflow-hidden border border-border shadow-xs">
        <CardHeader className="bg-muted/30 border-b border-border py-4 px-6 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span>Configured Government Services ({filteredServices.length})</span>
          </CardTitle>
          <span className="text-xs text-muted-foreground">Click Edit to modify required document checklists</span>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={5} columns={6} />
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="p-16 text-center text-muted-foreground text-sm">
              No services match the active filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Service Title</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Required Templates</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredServices.map((service: any) => (
                    <tr key={service._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground text-sm flex items-center gap-2">
                          <span>{service.title}</span>
                          <span className="text-xs text-muted-foreground font-mono">({service.slug})</span>
                        </div>
                        <div className="text-xs text-primary font-gujarati mt-0.5">{service.titleGu}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-medium text-foreground">{service.department}</div>
                        <div className="text-[11px] text-muted-foreground font-gujarati">{service.departmentGu}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {service.requiredTemplates && service.requiredTemplates.length > 0 ? (
                            service.requiredTemplates.map((t: any, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-[11px]">
                                {t.templateTitleGu || t.templateTitle || t.templateSlug}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">None configured</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="capitalize text-xs">
                          {service.category}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={service.status === 'active' ? 'success' : 'outline'}
                          className="capitalize text-xs"
                        >
                          {service.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/services/${service.slug}`} target="_blank">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Preview Public Page">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(service)}
                            className="h-8 gap-1.5 text-xs"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRetireService(service._id, service.title)}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            title="Retire Service"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE / EDIT SERVICE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col my-8">
            <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  <span>{editingService ? `Edit Service: ${editingService.title}` : 'Create New Citizen Service'}</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Define service metadata, administrative jurisdiction, and statutory document bundle checklists.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {formError && <Alert variant="destructive">{formError}</Alert>}
              {formSuccess && <Alert variant="success">{formSuccess}</Alert>}

              <form id="service-form" onSubmit={handleSaveService} className="space-y-6">
                {/* 1. Basic Metadata */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                    1. Basic Service Identification
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Service Title (English) *"
                      required
                      placeholder="e.g. Income Certificate (Dakhla)"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    <Input
                      label="Service Title (Gujarati) *"
                      required
                      placeholder="દા.ત. આવકનો દાખલો (સર્ટિફિકેટ)"
                      value={titleGu}
                      onChange={(e) => setTitleGu(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="URL Identifier (Slug)"
                      placeholder="e.g. income-certificate-service"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      disabled={!!editingService}
                    />
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">Category</label>
                      <Select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        options={CATEGORY_OPTIONS}
                      />
                    </div>
                    <Input
                      label="Jurisdiction"
                      value={jurisdiction}
                      onChange={(e) => setJurisdiction(e.target.value)}
                      placeholder="e.g. Gujarat (Gandhinagar / Statewide)"
                    />
                  </div>
                </div>

                {/* 2. Department & Legal Provenance */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                    2. Department & Legal Provenance
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Issuing Department (EN)"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Revenue Department"
                    />
                    <Input
                      label="Issuing Department (GU)"
                      value={departmentGu}
                      onChange={(e) => setDepartmentGu(e.target.value)}
                      placeholder="દા.ત. મહેસૂલ વિભાગ"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Effective Date"
                      type="date"
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                    />
                    <Input
                      label="Source Reference / Govt. Resolution"
                      value={sourceReference}
                      onChange={(e) => setSourceReference(e.target.value)}
                      placeholder="e.g. Gujarat GR No. DKH-102018-744-J"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Textarea
                      label="Description (EN)"
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Summary of citizen service..."
                    />
                    <Textarea
                      label="Description (GU)"
                      rows={2}
                      value={descriptionGu}
                      onChange={(e) => setDescriptionGu(e.target.value)}
                      placeholder="સેવાનો ટૂંક પરિચય..."
                    />
                  </div>
                </div>

                {/* 3. Required Document Checklist Picker */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      3. Required Document Templates Checklist ({selectedTemplates.length} selected)
                    </h3>
                    <span className="text-xs text-primary font-medium">
                      Select templates bundled for this service
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto p-2 border border-border rounded-lg bg-muted/20">
                    {availableTemplates.map((tpl: any) => {
                      const isSelected = selectedTemplates.some((t) => t.templateSlug === tpl.slug);
                      return (
                        <div
                          key={tpl.slug}
                          onClick={() => handleToggleTemplate(tpl)}
                          className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-start justify-between gap-2 ${
                            isSelected
                              ? 'border-primary bg-primary/10 shadow-xs'
                              : 'border-border bg-card hover:border-primary/50'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span>{tpl.title}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground font-gujarati">{tpl.titleGu}</div>
                            <Badge variant="outline" className="text-[10px] mt-1 capitalize">
                              {tpl.category}
                            </Badge>
                          </div>
                          <div className="mt-0.5">
                            {isSelected ? (
                              <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border border-muted-foreground shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Workflow Steps */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                    4. Citizen Application Steps
                  </h3>

                  <div className="space-y-2">
                    {steps.map((st, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-md border border-border bg-muted/30 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">{idx + 1}.</span>
                          <span className="text-foreground">{st}</span>
                          {stepsGu[idx] && (
                            <span className="text-muted-foreground font-gujarati">({stepsGu[idx]})</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(idx)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <Input
                      placeholder="Step in English (e.g. Submit physically at Jan Seva Kendra)"
                      value={stepInput}
                      onChange={(e) => setStepInput(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Step in Gujarati (દા.ત. જન સેવા કેન્દ્રમાં જમા કરાવો)"
                        value={stepInputGu}
                        onChange={(e) => setStepInputGu(e.target.value)}
                      />
                      <Button type="button" variant="outline" onClick={handleAddStep} className="shrink-0">
                        Add Step
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-border flex items-center justify-end gap-3 sticky bottom-0 bg-card">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="service-form"
                disabled={isSubmitting}
                className="gap-2 font-bold px-6"
              >
                {isSubmitting ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
