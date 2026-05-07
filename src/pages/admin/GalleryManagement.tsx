import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  Upload,
  Eye,
  Download
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

const GalleryManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const galleryImages = [
    {
      id: 1,
      url: 'https://i.postimg.cc/TPBc4x45/Artboard-1.webp',
      title: 'Formateur 1',
      category: 'Trainers',
      uploadDate: '2024-01-15',
      size: '245 KB',
      dimensions: '800x600',
      status: 'Active'
    },
    {
      id: 2,
      url: 'https://i.postimg.cc/TPBc4x41/Artboard-1-copy.webp',
      title: 'Formateur 2',
      category: 'Trainers',
      uploadDate: '2024-01-16',
      size: '312 KB',
      dimensions: '800x600',
      status: 'Active'
    },
    {
      id: 3,
      url: 'https://i.postimg.cc/Gp4QKtqs/Artboard-1-copy-2.webp',
      title: 'Formateur 3',
      category: 'Trainers',
      uploadDate: '2024-01-17',
      size: '289 KB',
      dimensions: '800x600',
      status: 'Active'
    },
    {
      id: 4,
      url: 'https://i.postimg.cc/g01KTpT2/Artboard-1-copy-3.webp',
      title: 'Formateur 4',
      category: 'Trainers',
      uploadDate: '2024-01-18',
      size: '267 KB',
      dimensions: '800x600',
      status: 'Active'
    },
    {
      id: 5,
      url: 'https://i.postimg.cc/k5LypCp5/Artboard-1-copy-4.webp',
      title: 'Formateur 5',
      category: 'Trainers',
      uploadDate: '2024-01-19',
      size: '298 KB',
      dimensions: '800x600',
      status: 'Active'
    },
    {
      id: 6,
      url: 'https://i.postimg.cc/jjBhFTFd/Artboard-1-copy-5.webp',
      title: 'Formateur 6',
      category: 'Trainers',
      uploadDate: '2024-01-20',
      size: '276 KB',
      dimensions: '800x600',
      status: 'Active'
    },
    {
      id: 7,
      url: 'https://i.postimg.cc/R02TDmDq/Artboard-1-copy-6.webp',
      title: 'Formateur 7',
      category: 'Trainers',
      uploadDate: '2024-01-21',
      size: '254 KB',
      dimensions: '800x600',
      status: 'Active'
    }
  ];

  const filteredImages = galleryImages.filter(image => {
    const matchesSearch = image.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || image.category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Trainers': return 'bg-blue-100 text-blue-800';
      case 'Courses': return 'bg-green-100 text-green-800';
      case 'Events': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gallery Management</h1>
            <p className="text-gray-600 mt-1">Manage images for your website carousel and gallery</p>
          </div>
          <div className="flex-shrink-0">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Image</DialogTitle>
                <DialogDescription>
                  Add a new image to your gallery.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Drag and drop your image here, or click to browse</p>
                  <Input type="file" accept="image/*" className="mt-2" />
                </div>
                <Input placeholder="Image Title" />
                <select className="w-full p-2 border rounded-md">
                  <option value="">Select Category</option>
                  <option value="trainers">Trainers</option>
                  <option value="courses">Courses</option>
                  <option value="events">Events</option>
                </select>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Upload Image</Button>
                </div>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Image Gallery</CardTitle>
            <CardDescription>Manage all images used in your website</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search images..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select 
                className="px-3 py-2 border rounded-md"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="trainers">Trainers</option>
                <option value="courses">Courses</option>
                <option value="events">Events</option>
              </select>
            </div>

            {/* Images Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4">
              {filteredImages.map((image) => (
                <Card key={image.id} className="hover:shadow-lg transition-shadow flex flex-col h-full">
                  <div className="aspect-square overflow-hidden rounded-t-lg flex-shrink-0">
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-3 flex-1 flex flex-col">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-medium text-xs lg:text-sm truncate flex-1">{image.title}</h3>
                        <Badge className={`text-xs ${getStatusColor(image.status)}`} variant="secondary">
                          {image.status}
                        </Badge>
                      </div>
                      
                      <Badge className={`text-xs ${getCategoryColor(image.category)}`} variant="secondary">
                        {image.category}
                      </Badge>
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="truncate">Size: {image.size}</div>
                        <div className="truncate">Dim: {image.dimensions}</div>
                        <div className="truncate">Date: {image.uploadDate}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 pt-2 mt-auto">
                      <Button variant="outline" size="sm" className="text-xs p-1 h-7">
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs p-1 h-7">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs p-1 h-7">
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 text-xs p-1 h-7">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredImages.length === 0 && (
              <div className="text-center py-8">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No images found matching your criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gallery Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{galleryImages.length}</p>
                  <p className="text-sm text-gray-600">Total Images</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Upload className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">2.1 MB</p>
                  <p className="text-sm text-gray-600">Total Size</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Eye className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{galleryImages.filter(img => img.status === 'Active').length}</p>
                  <p className="text-sm text-gray-600">Active Images</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Download className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">1,234</p>
                  <p className="text-sm text-gray-600">Total Views</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default GalleryManagement;
